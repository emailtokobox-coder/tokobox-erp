/**
 * @module finance/types/ProfitReport
 * Profit report types — monthly aggregation from `monthly_profit` view.
 *
 * Per PRD 7.7:
 *   - Bar chart profit per bulan
 *   - Line chart profit margin per bulan
 *   - Breakdown: Omzet, HPP, Income, Adjustment, Profit
 */

/**
 * Monthly profit data point.
 */
export interface MonthlyProfit {
  id: string
  storeId: string
  month: string          // ISO month string e.g. "2026-01-01"
  totalOrders: number
  totalOmzet: number
  totalHpp: number
  totalIncome: number
  totalAdjustment: number
  totalProfit: number
  profitMargin: number    // percentage 0-100
}

/**
 * Breakdown of profit components for a period.
 */
export interface ProfitBreakdown {
  totalOmzet: number
  totalHpp: number
  totalIncome: number
  totalAdjustment: number
  profitSebelumPenyesuaian: number
  profitSetelahPenyesuaian: number
  profitMargin: number
}

/**
 * Filter for profit report queries.
 */
export interface ProfitFilter {
  year?: number
  month?: number
}

/**
 * Result from profit report action.
 */
export interface ProfitReportResult {
  monthly: MonthlyProfit[]
  breakdown: ProfitBreakdown
  year: number
  monthCount: number
}
