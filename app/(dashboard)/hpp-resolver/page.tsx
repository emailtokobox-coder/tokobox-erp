/**
 * @module app/(dashboard)/hpp-resolver/page
 * HPP Resolver Page — displays SKUs without HPP that have valid orders.
 *
 * Per PRD 7.8:
 *   - SKU, Nama Produk
 *   - Order Count, Qty Valid Terdampak, Omzet Terkait
 *   - Contoh No. Pesanan (maks 5)
 *   - Actions: Input HPP manual
 *   - After HPP input → auto-recalculate profit
 *
 * Architecture:
 *   Page (server) → getHppResolverAction → HppResolverTable (client)
 */

import { getHppResolverAction } from "@/features/inventory/actions"
import HppResolverTable from "@/features/inventory/components/HppResolverTable"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

/* ─── Page ─── */

export default async function HppResolverPage() {
  const issues = await getHppResolverAction()
  const totalQty = issues.reduce((sum, i) => sum + i.qtyValidTerdampak, 0)
  const totalOmzet = issues.reduce((sum, i) => sum + i.omzetTerkait, 0)

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link href="/inventori">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">HPP Resolver</h1>
            <p className="text-sm text-muted-foreground">
              {issues.length} SKU tanpa HPP · {totalQty.toLocaleString("id-ID")} qty valid terdampak · Omzet terkait: Rp {totalOmzet.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      <HppResolverTable issues={issues} />
    </main>
  )
}
