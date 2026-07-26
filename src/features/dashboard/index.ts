/**
 * @module dashboard
 * Dashboard — KPI cards, charts, insights, and real-time finance.
 *
 * Per PRD 7.1:
 *   - KPI Cards (4 main + 4 sub)
 *   - Finance Real Time (omzet, fee, income, HPP, profit, margin)
 *   - Daily Trend Chart (7 days)
 *   - Insights (jam, ekspedisi, kota, produk, pembeli)
 *   - Quick Actions
 *
 * Architecture:
 *   Page (server) → getDashboardSummaryAction → Dashboard components (client)
 */

// Types
export type { DashboardSummary, DashboardData, DailyTrend, InsightItem } from "./types"

// Actions
export { getDashboardSummaryAction } from "./actions"

// Components
export { KpiCard, DailyTrendChart, InsightCard, FinanceRealTime, QuickActions } from "./components"
