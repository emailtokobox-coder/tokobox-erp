"use client"

/**
 * @module finance/components/ProfitChart
 * Profit Report — monthly profit visualization with CSS-based bar chart.
 *
 * Per PRD 7.7:
 *   - Bar chart profit per bulan
 *   - Line chart profit margin per bulan
 *   - Breakdown: Omzet, HPP, Income, Adjustment, Profit
 *
 * Since recharts is not in dependencies, uses plain HTML/CSS bars.
 */


import { Card } from "@/components/ui/card"
import { formatRupiah } from "@/features/shared/utils/format"
import { cn } from "@/lib/utils"
import type { MonthlyProfit, ProfitBreakdown } from "../types"

/* ─── Breakdown Cards ─── */

function BreakdownCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold mt-1", color)}>{formatRupiah(value)}</p>
    </div>
  )
}

/* ─── CSS Bar Chart ─── */

function ProfitBarChart({ data }: { data: MonthlyProfit[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Belum ada data profit untuk tahun ini.
      </div>
    )
  }

  const maxProfit = Math.max(...data.map((d) => Math.max(d.totalProfit, 1)))
  const maxMargin = Math.max(...data.map((d) => Math.max(d.profitMargin, 1)))

  // Month labels in Indonesian
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ]

  return (
    <div className="space-y-4">
      {/* Profit Bar Chart */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Profit per Bulan</p>
        <div className="flex items-end gap-1 h-40 border-b border-l pl-1">
          {data.map((item, idx) => {
            const monthIdx = new Date(item.month).getMonth()
            const barHeight = (item.totalProfit / maxProfit) * 100
            const isPositive = item.totalProfit >= 0

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Value tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-0.5 rounded whitespace-nowrap z-10">
                  {formatRupiah(item.totalProfit)}
                </div>
                <div
                  className={cn(
                    "w-full max-w-[32px] rounded-t transition-all",
                    isPositive ? "bg-emerald-500" : "bg-red-500"
                  )}
                  style={{ height: `${Math.max(barHeight, 2)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {monthLabels[monthIdx]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Profit Margin Line (percentage) */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Profit Margin (%)</p>
        <div className="flex items-end gap-1 h-16 border-b border-l pl-1">
          {data.map((item, idx) => {
            const monthIdx = new Date(item.month).getMonth()
            const lineHeight = (item.profitMargin / maxMargin) * 100

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-0.5"
              >
                <span className="text-[10px] text-muted-foreground">
                  {item.profitMargin.toFixed(1)}%
                </span>
                <div
                  className="w-full max-w-[32px] bg-blue-400 rounded-t"
                  style={{ height: `${Math.max(lineHeight, 2)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {monthLabels[monthIdx]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── ProfitChart Component ─── */

interface ProfitChartProps {
  monthly: MonthlyProfit[]
  breakdown: ProfitBreakdown
  year: number
}

export default function ProfitChart({ monthly, breakdown, year }: ProfitChartProps) {
  return (
    <div className="space-y-6">
      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <BreakdownCard label="Omzet Valid" value={breakdown.totalOmzet} color="text-blue-600" />
        <BreakdownCard label="Total HPP" value={breakdown.totalHpp} color="text-red-600" />
        <BreakdownCard label="Income Aktual" value={breakdown.totalIncome} color="text-emerald-600" />
        <BreakdownCard label="Adjustment" value={breakdown.totalAdjustment} color="text-amber-600" />
        <BreakdownCard label="Profit (Seb. Adj)" value={breakdown.profitSebelumPenyesuaian} color="text-violet-600" />
        <BreakdownCard label="Profit (Set. Adj)" value={breakdown.profitSetelahPenyesuaian} color="text-green-700" />
      </div>

      {/* Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Laporan Profit {year}</h3>
          <p className="text-xs text-muted-foreground">
            Margin: <span className="font-medium text-foreground">{breakdown.profitMargin.toFixed(2)}%</span>
          </p>
        </div>
        <ProfitBarChart data={monthly} />
      </Card>
    </div>
  )
}
