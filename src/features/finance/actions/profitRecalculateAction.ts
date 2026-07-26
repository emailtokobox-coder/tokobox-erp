/**
 * @module features/finance/actions/profitRecalculateAction
 * Profit Recalculate Server Action — triggered after HPP changes or adjustments added.
 *
 * Per PRD Section 3.11-3.13:
 * - Recalculate profit for all orders affected by HPP/income/adjustment changes
 * - Recalculate profit for all orders in a store
 *
 * Triggered by:
 * - ImportOrchestrator after HPP or adjustment insert
 * - HPP resolver after HPP value update
 * - Manual adjustment creation
 *
 * Architecture:
 * ServerAction → ProfitRecalculationService → DB update
 */

import { createSupabaseClient } from "@/lib/supabase/client"
import { ProfitRecalculationService } from "@/features/finance/services/ProfitRecalculationService"
import type { OrderHeader, AdjustmentRecord } from "@/features/orders/types/OrderItem"

// ─── Result Type ───

export interface ProfitRecalculateResult {
  success: boolean
  recalculatedCount: number
  skippedCount: number
  batalCount: number
  updatedOrders: Array<{
    noPesanan: string
    profitSebelumPenyesuaian: number
    profitSetelahPenyesuaian: number
    profitMargin: number
    totalPenyesuaian: number
  }>
  errors: string[]
}

// ─── Profit Recalculate Action ───

/**
 * Recalculate profit for all orders in a store.
 *
 * Process:
 * 1. Fetch all order headers for the store
 * 2. Fetch all adjustment records for the store
 * 3. Use ProfitRecalculationService to recalculate profit
 * 4. Update order records in DB
 *
 * @param storeId - Store identifier
 * @returns ProfitRecalculateResult with counts and errors
 */
export async function profitRecalculateAction(
  storeId: string,
): Promise<ProfitRecalculateResult> {
  const client = createSupabaseClient()
  const errors: string[] = []
  const updatedOrders: ProfitRecalculateResult["updatedOrders"] = []

  try {
    // 1. Fetch all order headers for the store
    const { data: headersData, error: headersError } = await client
      .from("orderHeaders")
      .select("*")
      .eq("store_id", storeId)

    if (headersError) {
      return {
        success: false,
        recalculatedCount: 0,
        skippedCount: 0,
        batalCount: 0,
        updatedOrders: [],
        errors: [`Gagal fetch orders: ${headersError.message}`],
      }
    }

    // Map DB rows to OrderHeader type
    const headers: OrderHeader[] = (headersData ?? []).map((row) => ({
      storeId: row.store_id ?? "",
      noPesanan: row.no_pesanan ?? "",
      statusPesanan: row.status_pesanan ?? "",
      waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
      waktuPembayaran: row.waktu_pembayaran ?? "",
      metodePembayaran: row.metode_pembayaran ?? "",
      usernamePembeli: row.username_pembeli ?? "",
      ekspedisi: row.ekspedisi ?? "",
      kota: row.kota ?? "",
      totalQtyOrder: row.total_qty_order ?? 0,
      totalQtyReturn: row.total_qty_return ?? 0,
      totalQtyValid: row.total_qty_valid ?? 0,
      totalOmzetValid: row.total_omzet_valid ?? 0,
      totalOmzetRetur: row.total_omzet_retur ?? 0,
      totalHppValid: row.total_hpp_valid ?? 0,
      totalHppRetur: row.total_hpp_retur ?? 0,
      statusOrderFinal: row.status_order_final ?? "Selesai / Normal",
      incomeAktual: row.income_aktual,
      statusIncome: row.status_income ?? "Belum Ada Income",
      totalPenyesuaian: row.total_penyesuaian ?? 0,
      profitSebelumPenyesuaian: row.profit_sebelum_penyesuaian ?? 0,
      profitSetelahPenyesuaian: row.profit_setelah_penyesuaian ?? 0,
      statusProfit: row.status_profit ?? "Belum Ada Income",
      statusHpp: row.status_hpp ?? "HPP Kosong",
      itemCount: row.item_count ?? 0,
      importDate: row.import_date ?? "",
    }))

    // 2. Fetch all adjustments for the store
    const { data: adjustmentsData, error: adjustmentsError } = await client
      .from("adjustments")
      .select("*")
      .eq("store_id", storeId)

    if (adjustmentsError) {
      return {
        success: false,
        recalculatedCount: 0,
        skippedCount: 0,
        batalCount: 0,
        updatedOrders: [],
        errors: [`Gagal fetch adjustments: ${adjustmentsError.message}`],
      }
    }

    const adjustments: AdjustmentRecord[] = (adjustmentsData ?? []).map((row) => ({
      id: row.id,
      storeId: row.store_id ?? "",
      noPesananTerhubung: row.no_pesanan_terhubung ?? "",
      tanggalAdjustment: row.tanggal_adjustment ?? "",
      tipeAdjustment: row.tipe_adjustment ?? "",
      biayaPenyesuaian: row.biaya_penyesuaian ?? 0,
      importDate: row.import_date ?? "",
    }))

    // 3. Calculate recalculation plan using service
    const updatePayload = ProfitRecalculationService.buildUpdatePayload(
      headers,
      adjustments,
    )

    if (updatePayload.size === 0) {
      // Nothing to recalculate
      return {
        success: true,
        recalculatedCount: 0,
        skippedCount: headers.length,
        batalCount: 0,
        updatedOrders: [],
        errors: [],
      }
    }

    // 4. Update each order in DB
    for (const [noPesanan, profitData] of updatePayload) {
      const { error: updateError } = await client
        .from("orderHeaders")
        .update({
          total_penyesuaian: profitData.totalPenyesuaian,
          profit_sebelum_penyesuaian: profitData.profitSebelumPenyesuaian,
          profit_setelah_penyesuaian: profitData.profitSetelahPenyesuaian,
          status_profit: profitData.statusProfit,
        })
        .eq("no_pesanan", noPesanan)
        .eq("store_id", storeId)

      if (updateError) {
        errors.push(`[${noPesanan}] Gagal update: ${updateError.message}`)
        continue
      }

      updatedOrders.push({
        noPesanan,
        profitSebelumPenyesuaian: profitData.profitSebelumPenyesuaian ?? 0,
        profitSetelahPenyesuaian: profitData.profitSetelahPenyesuaian ?? 0,
        profitMargin: 0, // Not stored in orderHeaders; computed in aggregate
        totalPenyesuaian: profitData.totalPenyesuaian ?? 0,
      })
    }

    const recalcSummary = ProfitRecalculationService.recalculateAll(
      headers,
      adjustments,
    )

    return {
      success: errors.length === 0,
      recalculatedCount: recalcSummary.recalculatedCount,
      skippedCount: recalcSummary.skippedCount,
      batalCount: recalcSummary.batalCount,
      updatedOrders,
      errors,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      recalculatedCount: 0,
      skippedCount: 0,
      batalCount: 0,
      updatedOrders: [],
      errors: [...errors, errorMessage],
    }
  }
}
