/**
 * @module finance
 * Finance — Income tracking, Profit report, Adjustment, Profit calculation.
 *
 * Per PRD 7.6, 7.7:
 *   - Income page: tabel income records + filter
 *   - Profit page: laporan profit bulanan + breakdown
 *
 * Architecture:
 *   Page (server) → actions → services → Supabase tables (incomes, orderHeaders, monthly_profit view)
 */

// Types
export type { IncomeRecord, IncomeFilter } from "./types/IncomeRecord"
export type {
  MonthlyProfit,
  ProfitBreakdown,
  ProfitFilter,
  ProfitReportResult,
} from "./types/ProfitReport"

// Services
export { IncomeSummaryService, ProfitRecalculationService } from "./services"
export type { MatchIncomeResult, EstimatedIncome } from "./services/IncomeSummaryService"
export type { RecalculateProfitResult, RecalculateAllResult } from "./services/ProfitRecalculationService"

// Actions
export { getIncomeAction, getProfitAction } from "./actions"
export { incomeSyncAction, type IncomeSyncResult } from "./actions/incomeSyncAction"
export { profitRecalculateAction, type ProfitRecalculateResult } from "./actions/profitRecalculateAction"

// Components
export { IncomeTable, ProfitChart } from "./components"
