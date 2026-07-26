"use client"

/**
 * @module dashboard/components/FinanceRealTime
 * Finance Real-Time — displays financial metrics: omzet, fee, income, HPP, profit, margin.
 *
 * Per PRD 7.1:
 *   - Omzet Valid, Potongan Marketplace (estimasi), Income Aktual
 *   - HPP Valid, Profit Akhir, Margin %
 */


import { Card } from "@/components/ui/card"
import type { FinanceRealTime } from "../types"
import { formatRupiah } from "@/features/shared/utils/format"

interface FinanceRealTimeProps {
  finance: FinanceRealTime
}

export default function FinanceRealTime({ finance }: FinanceRealTimeProps) {
  const items: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Omzet Valid", value: formatRupiah(finance.omzetValid) },
    { label: `Potongan Marketplace (${finance.marketplaceRatePct}%)`, value: `-${formatRupiah(finance.estimasiFeeMarketplace)}` },
    { label: "Estimasi Income", value: formatRupiah(finance.estimasiIncome) },
    { label: "Income Aktual", value: formatRupiah(finance.incomeAktual), highlight: true },
    { label: "HPP Valid", value: formatRupiah(finance.hppValid) },
    { label: "Profit Akhir", value: formatRupiah(finance.profitAkhir), highlight: true },
    {
      label: "Margin",
      value: `${finance.marginPct.toFixed(1)}%`,
      highlight: true,
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Keuangan Real Time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-sm font-semibold ${item.highlight ? "text-foreground" : "text-muted-foreground"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
