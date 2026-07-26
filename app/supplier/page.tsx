/**
 * @module app/supplier/page
 * Supplier List Page — list all suppliers with search and filter.
 *
 * Per PRD 5.13:
 *   - Supplier master data: Nama, Kontak, Email, Alamat, Produk, Lead Time, Aktif
 *
 * Architecture:
 *   Page (server) → getSuppliersAction → Supabase "suppliers" table
 */

import { Suspense } from "react"
import { getSuppliersAction } from "@/features/supplier/actions"
import { SupplierTable } from "@/features/supplier"
import { Skeleton } from "@/components/ui/skeleton"

/* ─── Page ─── */

export default async function SupplierPage() {
  const suppliers = await getSuppliersAction()

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Supplier</h1>
        <p className="text-sm text-muted-foreground">
          Kelola data supplier dan riwayat harga pembelian
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
        <SupplierTable items={suppliers} />
      </Suspense>
    </main>
  )
}
