"use client"

/**
 * @module dashboard/components/InsightCard
 * Insight Card — displays a single insight item (label, value, sub-value).
 *
 * Per PRD 7.1:
 *   - Jam Terbanyak, Ekspedisi Terpopuler, Kota Terbanyak, Produk Terlaris, Pembeli Terbanyak
 */


import { Card } from "@/components/ui/card"
import type { InsightItem } from "../types"

interface InsightCardProps {
  title: string
  items: InsightItem[]
}

export default function InsightCard({ title, items }: InsightCardProps) {
  if (items.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
        <p className="text-xs text-muted-foreground py-4 text-center">Belum ada data</p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {i + 1}
              </span>
              <span className="text-sm truncate max-w-[180px]" title={String(item.value)}>
                {item.value}
              </span>
            </div>
            <div className="text-right">
              {item.subValue && (
                <span className="text-xs text-muted-foreground">{item.subValue}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
