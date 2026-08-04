/**
 * @module features/upload/services/ImportOrchestrator
 * Import Orchestrator — coordinates the full import pipeline.
 *
 * Orchestrates: parse → validate → business logic → DB write
 * All DB writes happen within a single atomic transaction.
 *
 * Usage:
 *   const orchestrator = new ImportOrchestrator(client);
 *   const result = await orchestrator.run({
 *     orderBuffer, incomeBuffer, adjustmentBuffer, hppBuffer, grosirBuffer,
 *   });
 *
 * Architecture:
 *   UI → Actions → ImportOrchestrator → Services → Repositories → DbTransaction → Supabase
 *
 * Post-import triggers (Iter 47): income sync + profit recalculation are signaled
 * via flags in OrchestratorResult. The caller (importFilesAction) triggers them.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { DbTransaction } from "@/lib/database/transaction"
import { ImportOrderService } from "./ImportOrderService"
import { ImportIncomeService } from "./ImportIncomeService"
import { ImportAdjustmentService } from "./ImportAdjustmentService"
import { ImportHppService } from "./ImportHppService"
import { ImportGrosirService } from "./ImportGrosirService"
import { buildStockMovements, enrichStockMovementsWithDates } from "@/features/inventory/services"
import { StockSaldoService } from "@/features/inventory/services/StockSaldoService"
import type {
  ImportResult,
  OrderItemProcessed,
  IncomeRow,
  AdjustmentRow,
  HppRow,
  GrosirRow,
} from "../types"
import type { StockMovementRow } from "@/features/inventory/services"
import type { SaldoSyncResult } from "@/features/inventory/services/StockSaldoService"

/* ─── Input ─── */

export interface ImportPayload {
  orderBuffer?: ArrayBuffer
  incomeBuffer?: ArrayBuffer
  adjustmentBuffer?: ArrayBuffer
  hppBuffer?: ArrayBuffer
  grosirBuffer?: ArrayBuffer
  existingIncome?: Map<string, IncomeRow>
  storeId?: string
}

/* ─── Orchestrator Result ─── */

export interface OrchestratorResult {
  success: boolean
  orders: ImportResult<OrderItemProcessed>
  income: ImportResult<IncomeRow> & { toUpdate: Array<{ old: IncomeRow; new: IncomeRow }> }
  adjustments: ImportResult<AdjustmentRow>
  hpp: ImportResult<HppRow> & { hppMap: Map<string, number> }
  grosir: ImportResult<GrosirRow> & { grosirMap: Map<string, GrosirRow[]> }
  stockMovements: StockMovementRow[]
  saldoSyncResult: SaldoSyncResult | null
  incomeImported: boolean
  adjustmentsImported: boolean
  hppImported: boolean
  transactionCommitted: boolean
  errors: string[]
}

/* ─── ImportOrchestrator ─── */

export class ImportOrchestrator {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Run the full import pipeline.
   * Parses all files, then writes to DB within a single transaction.
   *
   * Post-import signals:
   * - incomeImported: true if new income rows were inserted → trigger IncomeSyncAction
   * - adjustmentsImported: true if new adjustments were inserted → trigger ProfitRecalculateAction
   * - hppImported: true if new HPP rows were inserted → trigger ProfitRecalculateAction
   */
  async run(payload: ImportPayload): Promise<OrchestratorResult> {
    const errors: string[] = []
    let saldoSyncResult: SaldoSyncResult | null = null

    /* ─── Step 1: Parse all files ─── */

    // HPP first (needed by OrderService for hppMap)
    let hppResult: ImportResult<HppRow> & { hppMap: Map<string, number> } = {
      success: false,
      status: "parsing",
      data: [],
      errors: [],
      warnings: [],
      summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      hppMap: new Map(),
    }
    if (payload.hppBuffer) {
      hppResult = ImportHppService.import(payload.hppBuffer)
    }

    // Build hppMap for OrderService
    const hppMap = hppResult.hppMap

    // Parse orders (needs hppMap)
    let orderResult: ImportResult<OrderItemProcessed> = {
      success: false,
      status: "parsing",
      data: [],
      errors: [],
      warnings: [],
      summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
    }
    if (payload.orderBuffer) {
      orderResult = ImportOrderService.import(payload.orderBuffer, hppMap)
    }

    // Parse income (needs existingIncome for idempotency)
    let incomeResult: ImportResult<IncomeRow> & { toUpdate: Array<{ old: IncomeRow; new: IncomeRow }> } = {
      success: false,
      status: "parsing",
      data: [],
      toUpdate: [],
      errors: [],
      warnings: [],
      summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
    }
    if (payload.incomeBuffer) {
      incomeResult = ImportIncomeService.import(payload.incomeBuffer, payload.existingIncome)
    }

    // Parse adjustments
    let adjustmentResult: ImportResult<AdjustmentRow> = {
      success: false,
      status: "parsing",
      data: [],
      errors: [],
      warnings: [],
      summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
    }
    if (payload.adjustmentBuffer) {
      adjustmentResult = ImportAdjustmentService.import(payload.adjustmentBuffer)
    }

    // Parse grosir
    let grosirResult: ImportResult<GrosirRow> & { grosirMap: Map<string, GrosirRow[]> } = {
      success: false,
      status: "parsing",
      data: [],
      errors: [],
      warnings: [],
      summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      grosirMap: new Map(),
    }
    if (payload.grosirBuffer) {
      grosirResult = ImportGrosirService.import(payload.grosirBuffer)
    }

    // Collect parse errors
    for (const err of orderResult.errors) errors.push(`[Order] ${err}`)
    for (const err of incomeResult.errors) errors.push(`[Income] ${err}`)
    for (const err of adjustmentResult.errors) errors.push(`[Adjustment] ${err}`)
    for (const err of hppResult.errors) errors.push(`[HPP] ${err}`)
    for (const err of grosirResult.errors) errors.push(`[Grosir] ${err}`)

    // If any parse errors → skip DB write
    if (errors.length > 0) {
      return {
        success: false,
        orders: orderResult,
        income: incomeResult,
        adjustments: adjustmentResult,
        hpp: hppResult,
        grosir: grosirResult,
        stockMovements: [],
        saldoSyncResult: null,
        incomeImported: false,
        adjustmentsImported: false,
        hppImported: false,
        transactionCommitted: false,
        errors,
      }
    }

    /* ─── Step 2: Build order headers from items ─── */

    const orderHeaders = ImportOrderService.buildHeaders(orderResult.data, hppMap)

    /* ─── Step 3: Generate stock movements from order items (Iter 44) ─── */

    const rawMovements = buildStockMovements(orderResult.data)
    const orderDates = new Map<string, string>()
    for (const header of orderHeaders.values()) {
      if (header.waktuPesananDibuat) {
        orderDates.set(header.noPesanan, header.waktuPesananDibuat)
      }
    }
    const stockMovements = enrichStockMovementsWithDates(rawMovements, orderDates)

    /* ─── Step 3: DB write within transaction ─── */

    const transaction = new DbTransaction(this.client, payload.storeId)
     const txBegin = await transaction.begin()

    if (!txBegin.success) {
      return {
        success: false,
        orders: orderResult,
        income: incomeResult,
        adjustments: adjustmentResult,
        hpp: hppResult,
        grosir: grosirResult,
        stockMovements: [],
       saldoSyncResult: null,
        incomeImported: false,
        adjustmentsImported: false,
        hppImported: false,
        transactionCommitted: false,
        errors: [`Gagal memulai transaksi: ${txBegin.error}`],
      }
    }

    try {
      const incomeImported = incomeResult.data.length > 0
      const adjustmentsImported = adjustmentResult.data.length > 0
      const hppImported = hppResult.data.length > 0

      // Insert order headers
       if (orderHeaders.size > 0) {
       const headerResult = await transaction.insertOrders(Array.from(orderHeaders.values()))
       if (!headerResult.success) {
       throw new Error(`Gagal insert order headers: ${headerResult.error}`)
       }
       }

       // Insert order items
       if (orderResult.data.length > 0) {
       const itemResult = await transaction.insertOrderItems(orderResult.data)
       if (!itemResult.success) {
       throw new Error(`Gagal insert order items: ${itemResult.error}`)
       }
       }

       // Insert new income rows
       if (incomeResult.data.length > 0) {
       const incomeDbResult = await transaction.insertIncome(incomeResult.data)
       if (!incomeDbResult.success) {
       throw new Error(`Gagal insert income: ${incomeDbResult.error}`)
       }
       }

       // Update existing income rows where values differ
       if (incomeResult.toUpdate.length > 0) {
       const updateResult = await transaction.updateIncome(incomeResult.toUpdate)
       if (!updateResult.success) {
       throw new Error(`Gagal update income: ${updateResult.error}`)
       }
       }

      // Insert adjustments
      if (adjustmentsImported) {
        const adjResult = await transaction.insertAdjustments(adjustmentResult.data)
        if (!adjResult.success) {
          throw new Error(`Gagal insert adjustments: ${adjResult.error}`)
        }
      }

      // Insert HPP
      if (hppImported) {
        const hppDbResult = await transaction.insertHpp(hppResult.data)
        if (!hppDbResult.success) {
          throw new Error(`Gagal insert HPP: ${hppDbResult.error}`)
        }
      }

      // Insert grosir
      if (grosirResult.data.length > 0) {
        const grosirDbResult = await transaction.insertGrosir(grosirResult.data)
        if (!grosirDbResult.success) {
          throw new Error(`Gagal insert grosir: ${grosirDbResult.error}`)
        }
      }

      // Insert stock movements (Iter 44 — auto-generated from orders)
      if (stockMovements.length > 0) {
        const stockResult = await transaction.insertStockMovements(stockMovements)
        if (!stockResult.success) {
          throw new Error(`Gagal insert stock movements: ${stockResult.error}`)
        }
      }

      // Sync stock saldo from movements (Iter 45 — auto-sync within transaction)
      if (stockMovements.length > 0) {
        const saldoMap = StockSaldoService.computeSaldoFromMovements(stockMovements)
        saldoSyncResult = await StockSaldoService.syncStockSaldo(this.client, saldoMap)
        if (saldoSyncResult.errors.length > 0) {
          throw new Error(`Gagal sync stock saldo: ${saldoSyncResult.errors.join(", ")}`)
        }
      }

      // Commit
      const commitResult = await transaction.commit()
       if (!commitResult.success) {
       throw new Error(`Gagal commit transaksi: ${commitResult.error}`)
       }

      return {
        success: true,
        orders: orderResult,
        income: incomeResult,
        adjustments: adjustmentResult,
        hpp: hppResult,
        grosir: grosirResult,
        stockMovements,
        saldoSyncResult,
        incomeImported,
        adjustmentsImported,
        hppImported,
        transactionCommitted: true,
        errors: [],
      }
    } catch (err) {
      // Rollback on any error
      try {
        await transaction.rollback()
      } catch {
        // Best-effort rollback
      }

      const errorMessage = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        orders: orderResult,
        income: incomeResult,
        adjustments: adjustmentResult,
        hpp: hppResult,
        grosir: grosirResult,
        stockMovements: [] as StockMovementRow[],
        saldoSyncResult: null,
        incomeImported: false,
        adjustmentsImported: false,
        hppImported: false,
        transactionCommitted: false,
        errors: [...errors, errorMessage],
      }
    }
  }
}
