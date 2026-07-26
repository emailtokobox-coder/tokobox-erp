/**
 * @module app/(dashboard)/inventori/page
 * Inventory Page — HPP per SKU, stock saldo, stock movements.
 *
 * Per PRD 7.4:
 * - Tabel HPP per SKU (SKU, Nama Produk, HPP, Updated At) + CRUD
 * - Tabel Stock Saldo (Base Product, Saldo, Last Updated)
 * - Stock Movement tracking (Base Product, Tipe, Tanggal, Qty, Source, Supplier)
 *   Auto-generated from imported Shopee orders (Iter 44):
 *     - qty_valid > 0 → KELUAR (items leaving warehouse to customer)
 *     - qty_return > 0 → MASUK (items returning from customer)
 * - Import HPP from Excel (via upload page)
 *
 * Architecture:
 * Page (server) → actions → Supabase
 */

import { Suspense } from "react"
import { getHppListAction, getStockSaldoAction, getStockMovementsAction, getLastSyncDateAction } from "@/features/inventory/actions"
import { HppTable, StockSaldoTable, StockMovementTable } from "@/features/inventory"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

/* ─── Page ─── */

export default async function InventoryPage() {
  const [hppItems, saldoItems, movements, { lastSyncAt }] = await Promise.all([
    getHppListAction(),
    getStockSaldoAction(),
    getStockMovementsAction(),
    getLastSyncDateAction(),
  ])

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventori & HPP</h1>
        <p className="text-sm text-muted-foreground">
          Kelola HPP per SKU, stok saldo, dan pergerakan stok
        </p>
      </div>

      <Tabs defaultValue="hpp">
        <TabsList>
          <TabsTrigger value="hpp">HPP per SKU</TabsTrigger>
          <TabsTrigger value="saldo">Stok Saldo</TabsTrigger>
          <TabsTrigger value="movement">Pergerakan Stok</TabsTrigger>
        </TabsList>
        <TabsContent value="hpp">
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg mt-4" />}>
            <HppTable items={hppItems} />
          </Suspense>
        </TabsContent>
        <TabsContent value="saldo">
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg mt-4" />}>
            <StockSaldoTable items={saldoItems} lastSyncAt={lastSyncAt} />
          </Suspense>
        </TabsContent>
        <TabsContent value="movement">
          <div className="mt-4">
            <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg mt-4" />}>
              <StockMovementTable items={movements} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
