/**
 * @module features/finance/services
 * Finance services — business logic layer for income matching, estimation, and profit recalculation.
 *
 * Per PRD Section 3.10-3.13:
 * - IncomeSummaryService: match income to orders, estimate missing income
 * - ProfitRecalculationService: recalculate profit after HPP/adjustment changes
 */

export { IncomeSummaryService } from "./IncomeSummaryService"
export type { MatchIncomeResult, EstimatedIncome } from "./IncomeSummaryService"

export { ProfitRecalculationService } from "./ProfitRecalculationService"
export type { RecalculateProfitResult, RecalculateAllResult } from "./ProfitRecalculationService"
