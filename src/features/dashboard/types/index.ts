/**
 * @module dashboard/types
 * Dashboard types — KPI cards, trend data, insights, and summary.
 */

// ─── Dashboard Summary (from OrderCalculator.buildSummary) ───

export interface DashboardSummary {
  totalOmzet: number
  totalHpp: number
  totalIncome: number
  totalProfit: number
  totalPenyesuaian: number
  totalOrder: number
  orderNormal: number
  orderReturSebagian: number
  orderReturFull: number
  orderBatal: number
  profitMargin: number
  hppLengkapCount: number
  hppSebagianCount: number
  hppKosongCount: number
  belumAdaIncome: number
}

// ─── KPI Card ───

export interface KpiCard {
  label: string
  value: string
  subValue?: string
  icon: string
  trend?: "up" | "down" | "neutral"
  color: "primary" | "success" | "warning" | "destructive" | "neutral"
}

// ─── Daily Trend ───

export interface DailyTrend {
  date: string
  omzet: number
  profit: number
  orderCount: number
}

// ─── Insight Card ───

export interface InsightCard {
  title: string
  items: InsightItem[]
}

export interface InsightItem {
  label: string
  value: string | number
  subValue?: string
}

// ─── Finance Real-time ───

export interface FinanceRealTime {
  omzetValid: number
  estimasiFeeMarketplace: number
  estimasiIncome: number
  incomeAktual: number
  hppValid: number
  profitAkhir: number
  marginPct: number
  marketplaceRatePct: number
}

// ─── Dashboard Data (aggregated for page) ───

export interface DashboardData {
  summary: DashboardSummary
  trends: DailyTrend[]
  insights: {
    jamTerbanyak: InsightItem | null
    ekspedisiTerpopuler: InsightItem | null
    kotaTerbanyak: InsightItem | null
    produkTerlaris: InsightItem | null
    pembeliTerbanyak: InsightItem | null
  }
  finance: FinanceRealTime
  lastImport: string | null
}
