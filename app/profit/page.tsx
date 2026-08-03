/**
 * @module app/profit/page
 * Profit Page — monthly profit report with breakdown.
 *
 * Per PRD 7.7:
 *   - Laporan Profit bulanan
 *   - Breakdown: Omzet, HPP, Income, Adjustment, Profit
 *   - Bar chart profit per bulan
 *   - Line chart profit margin per bulan
 *
 * Architecture:
 *   Page (server) → getProfitAction → monthly_profit view
 */

import { Suspense } from "react"
import { getProfitAction } from "@/features/finance/actions"
import { ProfitChart } from "@/features/finance"
import { Skeleton } from "@/components/ui/skeleton"

/* ─── Force dynamic rendering — page uses server actions with Supabase ─── */
export const dynamic = "force-dynamic"

/* ─── Page ─── */

export default async function ProfitPage() {
  const report = await getProfitAction()

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Profit</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan profit per bulan — {report.year}
          {report.monthCount > 0
            ? ` (${report.monthCount} bulan dengan data)`
            : " — Belum ada data"}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <ProfitChart
          monthly={report.monthly}
          breakdown={report.breakdown}
          year={report.year}
        />
      </Suspense>
    </main>
  )
}
