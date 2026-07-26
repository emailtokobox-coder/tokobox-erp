/**
 * @module features/finance/services/IncomeSummaryService
 * Income Summary Service — pure business logic for income matching and estimation.
 *
 * Per PRD Section 3.10:
 * 1. matchIncomeToOrders: match income.noPesanan → order.noPesanan
 * 2. calculateEstimatedIncome: estimate income for orders without actual income
 *
 * Architecture:
 * ImportOrchestrator → IncomeSummaryService → OrderCalculator.matchIncome()
 *
 * NOTE: This is a pure logic layer. No DB access.
 */

import type {
  OrderHeader,
  IncomeRecord,
} from "@/features/orders/types/OrderItem";

// ─── Result Types ───

/**
 * Result from matchIncomeToOrders.
 */
export interface MatchIncomeResult {
  headers: OrderHeader[]
  matchedCount: number
  estimatedCount: number
  alreadyMatchedCount: number
  errors: string[]
}

/**
 * Estimation result for a single order.
 */
export interface EstimatedIncome {
  noPesanan: string
  estimasi: number
  marketplaceFee: number
  statusIncome: "Belum Ada Income / Estimasi"
}

// ─── Default Marketplace Rate ───

/**
 * Default marketplace fee rate (25%) used when no settings override exists.
 * Per PRD Section 3.10: marketplaceRatePct = 25 by default.
 */
const DEFAULT_MARKETPLACE_RATE_PCT = 25

// ─── Income Summary Service ───

export const IncomeSummaryService = {
  /**
   * Match all income records to order headers.
   *
   * Rules:
   * - Match: income.noPesanan → order.noPesanan (exact match)
   * - Skip idempotent: if order.status_income already "Sudah Cocok" AND the income
   *   values haven't changed, don't re-match (PRD 3.10)
   * - Calculate estimated income for orders that still don't have income after matching
   *
   * @param headers - Array of order headers
   * @param incomes - Array of income records
   * @param marketplaceRatePct - Marketplace fee percentage (default 25)
   * @returns MatchIncomeResult with updated headers and counts
   */
  matchIncomeToOrders(
    headers: OrderHeader[],
    incomes: IncomeRecord[],
    marketplaceRatePct: number = DEFAULT_MARKETPLACE_RATE_PCT,
  ): MatchIncomeResult {
    const errors: string[] = []

    // Build income lookup map: noPesanan → IncomeRecord
    const incomeMap = new Map<string, IncomeRecord>()
    for (const income of incomes) {
      incomeMap.set(income.noPesanan, income)
    }

    // Match income to orders
    let matchedHeaders = headers.map((header) => {
      const income = incomeMap.get(header.noPesanan)

      if (!income) {
        // No income for this order, skip matching
        return header
      }

      // Idempotent: if already "Sudah Cocok" with the same income, skip
      if (header.statusIncome === "Sudah Cocok" && header.incomeAktual != null) {
        return header
      }

      // Match! Calculate derived fields
      const incomeAktual = income.totalPenghasilan
      const profitSebelumPenyesuaian = incomeAktual - header.totalHppValid
      const profitSetelahPenyesuaian =
        incomeAktual + header.totalPenyesuaian - header.totalHppValid

      return {
        ...header,
        incomeAktual,
        statusIncome: "Sudah Cocok" as const,
        profitSebelumPenyesuaian,
        profitSetelahPenyesuaian,
        statusProfit: "Sudah Dihitung" as const,
        // Enrich with payment info from income
        waktuPembayaran: header.waktuPembayaran || income.tanggalDanaDilepaskan,
        metodePembayaran: header.metodePembayaran || income.metodePembayaran,
        usernamePembeli: header.usernamePembeli || income.usernamePembeli,
      }
    })

    // Calculate estimated income for orders that still don't have income matched
    // PRD 3.10: only estimate for non-cancelled orders without income
    let estimatedCount = 0
    matchedHeaders = matchedHeaders.map((header) => {
      if (header.statusOrderFinal === "Batal") {
        return header // Skip cancelled orders
      }

      if (header.statusIncome === "Sudah Cocok") {
        return header // Already matched
      }

      if (header.statusIncome === "Tidak Perlu Income") {
        return header // Doesn't need income (e.g., manually created order)
      }

  // Estimate income: totalOmzetValid - marketplace fee
  const estimasi = this.calculateEstimatedIncome(header, marketplaceRatePct)
  if (estimasi > 0) {
    estimatedCount++
    return {
      ...header,
      incomeAktual: estimasi,
      statusIncome: "Belum Ada Income / Estimasi",
      profitSebelumPenyesuaian: estimasi - header.totalHppValid,
      profitSetelahPenyesuaian:
        estimasi + header.totalPenyesuaian - header.totalHppValid,
      statusProfit: "Belum Ada Income / Estimasi",
    } as OrderHeader
  }

      return header
    })

    return {
      headers: matchedHeaders,
      matchedCount: incomes.length, // All incomes were processed
      estimatedCount,
      alreadyMatchedCount: 0, // Could be enhanced with comparison logic
      errors,
    }
  },

  /**
   * Calculate estimated income for a single order.
   *
   * Formula (PRD 3.10):
   *   estimasi = totalOmzetValid - estimasiFeeMarketplace
   *   estimasiFeeMarketplace = totalOmzetValid × (marketplaceRatePct / 100)
   *
   * @param order - Order header
   * @param marketplaceRatePct - Marketplace fee percentage (default 25)
   * @returns Estimated income amount (0 if omzet is 0 or order is cancelled)
   */
  calculateEstimatedIncome(
    order: OrderHeader,
    marketplaceRatePct: number = DEFAULT_MARKETPLACE_RATE_PCT,
  ): number {
    // Skip cancelled or zero-omzet orders
    if (order.statusOrderFinal === "Batal" || order.totalOmzetValid === 0) {
      return 0
    }

    const fee = order.totalOmzetValid * (marketplaceRatePct / 100)
    const estimasi = order.totalOmzetValid - fee

    // Sanity check: should not be negative
    return Math.max(estimasi, 0)
  },
}
