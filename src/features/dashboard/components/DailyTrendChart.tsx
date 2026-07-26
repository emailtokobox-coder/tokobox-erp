"use client"

/**
 * @module dashboard/components/DailyTrendChart
 * Daily Trend Chart — line chart showing 7-day omzet and profit trends.
 *
 * Per PRD 7.1:
 *   - Line chart omzet 7 hari terakhir
 *   - Line chart profit 7 hari terakhir
 *
 * Uses pure SVG (no external chart library) for lightweight rendering.
 */


import { Card } from "@/components/ui/card"
import type { DailyTrend } from "../types"

interface DailyTrendChartProps {
  trends: DailyTrend[]
}

export default function DailyTrendChart({ trends }: DailyTrendChartProps) {
  if (trends.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Tren Harian (7 Hari)</h3>
        <p className="text-xs text-muted-foreground py-8 text-center">Belum ada data tren</p>
      </Card>
    )
  }

  const maxOmzet = Math.max(...trends.map((t) => t.omzet), 1)
  const maxProfit = Math.max(...trends.map((t) => t.profit), 1)

  const width = 600
  const height = 200
  const padding = { top: 20, right: 60, bottom: 30, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const xStep = chartWidth / (trends.length - 1 || 1)

  const omzetPoints = trends.map((t, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - (t.omzet / maxOmzet) * chartHeight,
  }))

  const profitPoints = trends.map((t, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - (t.profit / maxProfit) * chartHeight,
  }))

  const omzetPath = omzetPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const profitPath = profitPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  const formatDay = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Tren Harian (7 Hari)</h3>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]" style={{ height: 220 }}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding.top + (chartHeight / 4) * i
            return (
              <line
                key={`grid-${i}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="1"
              />
            )
          })}

          {/* Omzet line */}
          <path d={omzetPath} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />

          {/* Profit line */}
          <path d={profitPath} fill="none" stroke="currentColor" className="text-green-500" strokeWidth="2" strokeDasharray="4 2" />

          {/* Omzet dots */}
          {omzetPoints.map((p, i) => (
            <circle key={`omzet-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="currentColor" className="text-primary" />
          ))}

          {/* Profit dots */}
          {profitPoints.map((p, i) => (
            <circle key={`profit-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="currentColor" className="text-green-500" />
          ))}

          {/* X-axis labels */}
          {trends.map((t, i) => (
            <text
              key={`label-${i}`}
              x={padding.left + i * xStep}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {formatDay(t.date)}
            </text>
          ))}

          {/* Y-axis labels (omzet) */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding.top + (chartHeight / 4) * i
            const value = maxOmzet - (maxOmzet / 4) * i
            return (
              <text
                key={`y-label-${i}`}
                x={width - padding.right + 5}
                y={y + 3}
                className="text-[9px] fill-muted-foreground"
              >
                {value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${(value / 1_000).toFixed(0)}K`}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-primary rounded" />
          <span className="text-xs text-muted-foreground">Omzet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-green-500 rounded" style={{ borderTop: "2px dashed currentColor" }} />
          <span className="text-xs text-muted-foreground">Profit</span>
        </div>
      </div>
    </Card>
  )
}
