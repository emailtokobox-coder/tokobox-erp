/**
 * @module app/income/page
 * Income Page — list of income records with filters.
 *
 * Per PRD 7.6:
 *   - Tabel Income: No. Pesanan, Pembeli, Tanggal Dana, Total Penghasilan, Metode
 *   - Filter by date range
 *   - Match status (Sudah Cocok / Belum Ada Income)
 *
 * Architecture:
 *   Page (server) → getIncomeAction → Supabase "incomes" table
 */

import { Suspense } from "react"
import { getIncomeAction } from "@/features/finance/actions"
import { IncomeTable } from "@/features/finance"
import { Skeleton } from "@/components/ui/skeleton"

/* ─── Force dynamic rendering — page uses server actions with Supabase ─── */
export const dynamic = "force-dynamic"

/* ─── Page ─── */

export default async function IncomePage() {
  const incomeRecords = await getIncomeAction()

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
        <p className="text-sm text-muted-foreground">
          Daftar income dari Shopee — Total Penghasilan per No. Pesanan
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
        <IncomeTable items={incomeRecords} />
      </Suspense>
    </main>
  )
}
