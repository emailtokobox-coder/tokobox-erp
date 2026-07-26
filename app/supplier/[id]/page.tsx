/**
 * @module app/supplier/[id]/page
 * Supplier Detail Page — view supplier info + price history.
 *
 * Architecture:
 *   Page (server) → getSupplierAction + getSupplierPricesAction → Supabase
 */

import { Suspense } from "react"
import { getSupplierAction, getSupplierPricesAction } from "@/features/supplier/actions"
import { SupplierDetail } from "@/features/supplier"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"

/* ─── Page ─── */

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supplier = await getSupplierAction(params.id)

  if (!supplier) {
    notFound()
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Detail Supplier</h1>
        <p className="text-sm text-muted-foreground">
          {supplier.nama} — Informasi dan riwayat harga
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <SupplierDetailWrapper supplier={supplier as Awaited<ReturnType<typeof getSupplierAction>> & { id: string }} />
      </Suspense>
    </main>
  )
}

async function SupplierDetailWrapper({ supplier }: { supplier: Awaited<ReturnType<typeof getSupplierAction>> & { id: string } }) {
  const prices = await getSupplierPricesAction(supplier.id)

  return (
    <SupplierDetail
      supplier={supplier}
      prices={prices}
      onAddPrice={async (data) => {
        await fetch(`/api/supplier/${supplier.id}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }}
    />
  )
}
