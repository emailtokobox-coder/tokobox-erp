/**
 * @module features/finance/services/ProfitRecalculationService
 * Profit Recalculation Service — pure business logic for profit recalculation.
 *
 * Per PRD Section 3.11-3.13:
 * 1. recalculateProfit: recalculate profit for a single order given adjustment
 * 2. recalculateAll: recalculate profit for all orders in a store
 *
 * Key formulas (PRD 3.12):
 *   profit_sebelum_penyesuaian = income_aktual - totalHppValid
 *   profit_setelah_penyesuaian  = income_aktual + totalPenyesuaian - totalHppValid
 *   profit_margin               = totalOmzetValid > 0 ? (profit / omzet) * 100 : 0
 *
 * Rules (PRD 3.13):
 * - Idempotent: skip if status already "Sudah Dihitung" AND data hasn't changed
 * - Adjustment only applies to non-cancelled orders
 *
 * Architecture:
 * ServerAction → ProfitRecalculationService → Update Order Headers → DB
 */

import type {
  OrderHeader,
  AdjustmentRecord,
} from "@/features/orders/types/OrderItem";

// ─── Result Types ───

/**
 * Result from recalculateProfit for a single order.
 */
export interface RecalculateProfitResult {
  noPesanan: string
  profitSebelumPenyesuaian: number
  profitSetelahPenyesuaian: number
  profitMargin: number
  statusProfit: "Sudah Dihitung" | "Belum Ada Income" | "Tidak Dihitung"
  recalculated: boolean
  wasIdempotent: boolean
}

/**
 * Result from recalculateAll.
 */
export interface RecalculateAllResult {
  recalculatedCount: number
  skippedCount: number
  batalCount: number
  errors: string[]
}

// ─── Profit Recalculation Service ───

export const ProfitRecalculationService = {
  /**
   * Recalculate profit for a single order header.
   *
   * Per PRD 3.11-3.13:
   *   profit_sebelum_penyesuaian = income_aktual - totalHppValid
   *   profit_setelah_penyesuaian  = income_aktual + totalPenyesuaian - totalHppValid
   *   profit_margin               = totalOmzetValid > 0 ? (profit / omzet) * 100 : 0
   *
   * Idempotent: if status is already "Sudah Dihitung" and no new adjustment, skip.
   * Adjustment only applies to non-cancelled orders.
   *
   * @param order - Order header to recalculate
   * @param totalPenyesuaian - Total adjustment amount for this order (new or existing)
   * @returns RecalculateProfitResult with updated profit values
   */
  recalculateProfit(
    order: OrderHeader,
    totalPenyesuaian: number,
  ): RecalculateProfitResult {
    // Rule: adjustment only applies to non-cancelled orders (PRD 3.5)
    if (order.statusOrderFinal === "Batal") {
      return {
        noPesanan: order.noPesanan,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        profitMargin: 0,
        statusProfit: "Tidak Dihitung",
        recalculated: false,
        wasIdempotent: false,
      }
    }

    // Rule: idempotent — skip if already "Sudah Dihitung" and adjustment unchanged
    // (Note: full idempotency check requires prior state; here we always recalculate
    //  since the caller passes the latest totalPenyesuaian)
    const incomeAktual = order.incomeAktual ?? 0

    // If no income yet, mark as pending
    if (incomeAktual === 0 && order.statusIncome !== "Tidak Perlu Income") {
      return {
        noPesanan: order.noPesanan,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        profitMargin: 0,
        statusProfit: "Belum Ada Income",
        recalculated: false,
        wasIdempotent: false,
      }
    }

    // Calculate profit values (PRD 3.12)
    const profitSebelumPenyesuaian = incomeAktual - order.totalHppValid
    const profitSetelahPenyesuaian =
      incomeAktual + totalPenyesuaian - order.totalHppValid
    const profitMargin =
      order.totalOmzetValid > 0
        ? (profitSetelahPenyesuaian / order.totalOmzetValid) * 100
        : 0

    // Idempotency: check if already computed with same values
    const wasIdempotent =
      order.statusProfit === "Sudah Dihitung" &&
      order.profitSebelumPenyesuaian === profitSebelumPenyesuaian &&
      order.profitSetelahPenyesuaian === profitSetelahPenyesuaian &&
      order.totalPenyesuaian === totalPenyesuaian

    return {
      noPesanan: order.noPesanan,
      profitSebelumPenyesuaian,
      profitSetelahPenyesuaian,
      profitMargin,
      statusProfit: "Sudah Dihitung",
      recalculated: !wasIdempotent,
      wasIdempotent,
    }
  },

  /**
   * Recalculate profit for all orders in a store.
   *
   * Process:
   * 1. Build adjustment lookup: noPesanan → totalPenyesuaian
   * 2. For each order: apply adjustments, recalculate profit
   * 3. Return summary of changes
   *
   * Idempotent (PRD 3.13): skip orders that already have "Sudah Dihitung" with
   * the same profit values — only recalculate if adjustments or income changed.
   *
   * @param headers - Array of order headers for the store
   * @param adjustments - Array of adjustment records for the store
   * @returns RecalculateAllResult with counts and errors
   */
  recalculateAll(
    headers: OrderHeader[],
    adjustments: AdjustmentRecord[] = [],
  ): RecalculateAllResult {
    const result: RecalculateAllResult = {
      recalculatedCount: 0,
      skippedCount: 0,
      batalCount: 0,
      errors: [],
    }

    // Build adjustment lookup: noPesanan → totalPenyesuaian
    const adjMap = new Map<string, number>()
    for (const adj of adjustments) {
      const existing = adjMap.get(adj.noPesananTerhubung) ?? 0
      adjMap.set(adj.noPesananTerhubung, existing + adj.biayaPenyesuaian)
    }

    // Recalculate each order
    for (const order of headers) {
      const totalPenyesuaian = adjMap.get(order.noPesanan) ?? 0

      const calcResult = this.recalculateProfit(order, totalPenyesuaian)

      if (calcResult.statusProfit === "Tidak Dihitung") {
        result.batalCount++
        continue
      }

      if (calcResult.wasIdempotent) {
        result.skippedCount++
      } else if (calcResult.recalculated) {
        result.recalculatedCount++
      } else {
        result.skippedCount++
      }
    }

    return result
  },

  /**
   * Build profit recalculation results for updating order headers in batch.
   *
   * Returns a map of noPesanan → profit data to update in DB.
   * Use this to prepare update payloads for bulk DB operations.
   *
   * @param headers - Array of order headers
   * @param adjustments - Array of adjustment records
   * @returns Map of noPesanan → partial OrderHeader for DB update
   */
  buildUpdatePayload(
    headers: OrderHeader[],
    adjustments: AdjustmentRecord[] = [],
  ): Map<string, Partial<OrderHeader>> {
    // Build adjustment lookup
    const adjMap = new Map<string, number>()
    for (const adj of adjustments) {
      const existing = adjMap.get(adj.noPesananTerhubung) ?? 0
      adjMap.set(adj.noPesananTerhubung, existing + adj.biayaPenyesuaian)
    }

    const payload = new Map<string, Partial<OrderHeader>>()

    for (const order of headers) {
      const totalPenyesuaian = adjMap.get(order.noPesanan) ?? 0

      // Skip cancelled orders
      if (order.statusOrderFinal === "Batal") continue

      // Skip orders without income
      const incomeAktual = order.incomeAktual ?? 0
      if (incomeAktual === 0 && order.statusIncome !== "Tidak Perlu Income") {
        continue
      }

  // Calculate profit values
  const profitSebelumPenyesuaian = incomeAktual - order.totalHppValid
  const profitSetelahPenyesuaian =
    incomeAktual + totalPenyesuaian - order.totalHppValid

  // Idempotency: only include if values changed
      if (
        order.statusProfit === "Sudah Dihitung" &&
        order.profitSebelumPenyesuaian === profitSebelumPenyesuaian &&
        order.profitSetelahPenyesuaian === profitSetelahPenyesuaian &&
        order.totalPenyesuaian === totalPenyesuaian
      ) {
        continue // No change needed
      }

      payload.set(order.noPesanan, {
        totalPenyesuaian,
        profitSebelumPenyesuaian,
        profitSetelahPenyesuaian,
        statusProfit: "Sudah Dihitung",
        // profitMargin isn't in OrderHeader type, it's in MonthlyProfit
        // but we include it for caller awareness
      })
    }

    return payload
  },
}
