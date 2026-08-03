/**
 * @module app/status-tracker/page
 * Status Tracker Page — kanban board + timeline view of all orders.
 *
 * Per PRD 7.10:
 *   - Timeline visual semua pesanan (manual + Shopee)
 *   - Filter by date range, status, search by No. Pesanan / nama pelanggan
 *   - Kanban board view (Draft, Menunggu, Produksi, Siap Kirim, Terkirim, Lunas, Selesai)
 *
 * Architecture:
 *   Page (server) → getUnifiedOrdersAction → StatusKanban (client)
 */

import { Suspense } from "react"
import { getUnifiedOrdersAction } from "@/features/status-tracker/actions"
import StatusKanban from "@/features/status-tracker/components/StatusKanban"

/* ─── Force dynamic rendering — page uses server actions with Supabase ─── */
export const dynamic = "force-dynamic"

/* ─── Loading Skeleton ─── */

function TrackerSkeleton() {
  return (
    <div className="max-w-full mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      <div className="flex gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-64 space-y-2">
            <div className="h-6 bg-muted animate-pulse rounded-md" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Filter Bar ─── */

function FilterBar({ dateFrom, dateTo, status, search }: {
  dateFrom: string
  dateTo: string
  status: string
  search: string
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="date"
        name="dateFrom"
        defaultValue={dateFrom}
        className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      <span className="text-xs text-muted-foreground">s/d</span>
      <input
        type="date"
        name="dateTo"
        defaultValue={dateTo}
        className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">Semua Status</option>
        <option value="Draft">Draft</option>
        <option value="Menunggu_Pembayaran_DP">Menunggu DP</option>
        <option value="DP_Lunas">DP Lunas</option>
        <option value="Produksi">Produksi</option>
        <option value="Siap_Kirim">Siap Kirim</option>
        <option value="Terkirim">Terkirim</option>
        <option value="Lunas">Lunas</option>
        <option value="Selesai">Selesai</option>
        <option value="Selesai / Normal">Selesai / Normal</option>
      </select>
      <input
        type="text"
        name="search"
        defaultValue={search}
        placeholder="Cari No. Pesanan / Nama..."
        className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-48"
      />
      <button
        type="submit"
        className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
      >
        Filter
      </button>
    </div>
  )
}

/* ─── Page ─── */

export default async function StatusTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const filter = {
    dateFrom: params.dateFrom || "",
    dateTo: params.dateTo || "",
    status: params.status || "",
    search: params.search || "",
  }

  const orders = await getUnifiedOrdersAction(
    Object.fromEntries(
      Object.entries(filter).filter(([, v]) => v)
    ) as Parameters<typeof getUnifiedOrdersAction>[0]
  )

  // Count by column
  const totalByColumn = (columnId: string) => orders.filter(o => o.columnId === columnId).length

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Status Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Timeline & Kanban board — {orders.length} pesanan
          {filter.dateFrom && ` dari ${filter.dateFrom}`}
          {filter.dateTo && ` s/d ${filter.dateTo}`}
        </p>
      </div>

      {/* Filters */}
      <form method="GET">
        <FilterBar
          dateFrom={filter.dateFrom}
          dateTo={filter.dateTo}
          status={filter.status}
          search={filter.search}
        />
      </form>

      {/* Column Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { id: "draft", label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
          { id: "menunggu", label: "Menunggu", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
          { id: "produksi", label: "Produksi", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
          { id: "siap-kirim", label: "Siap Kirim", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
          { id: "terkirim", label: "Terkirim", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
          { id: "lunas", label: "Lunas", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
          { id: "selesai", label: "Selesai", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
        ].map(col => (
          <span key={col.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${col.color}`}>
            {col.label}: {totalByColumn(col.id)}
          </span>
        ))}
      </div>

      {/* Kanban Board */}
      <Suspense fallback={<TrackerSkeleton />}>
        <StatusKanban orders={orders} />
      </Suspense>
    </main>
  )
}
