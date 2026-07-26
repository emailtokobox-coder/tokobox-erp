"use client"

import { useState } from "react";

/**
 * @module inventory/components/HppResolverTable
 * HPP Resolver Table — displays SKUs without HPP that have valid orders.
 *
 * Per PRD 7.8:
 *   - SKU, Nama Produk
 *   - Order Count, Qty Valid Terdampak, Omzet Terkait
 *   - Contoh No. Pesanan (maks 5)
 *   - Actions: Input HPP manual
 *   - After HPP input → auto-recalculate profit
 */


import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import type { HppIssue } from "../types"
import { saveHppAction } from "../actions"
import { formatRupiah } from "@/features/shared/utils/format"

interface HppResolverTableProps {
  issues: HppIssue[]
}

export default function HppResolverTable({ issues }: HppResolverTableProps) {
  const [addingSku, setAddingSku] = useState<string | null>(null)
  const [hppValue, setHppValue] = useState("")
  const [namaValue, setNamaValue] = useState("")
  const [saving, setSaving] = useState(false)

  const startAdd = (issue: HppIssue) => {
    setAddingSku(issue.skuNormalized)
    setNamaValue(issue.namaProduk)
    setHppValue("")
  }

  const handleSave = async (issue: HppIssue) => {
    setSaving(true)
    await saveHppAction({
      sku: issue.sku,
      skuNormalized: issue.skuNormalized,
      hpp: Number(hppValue) || 0,
      namaProduk: namaValue || issue.namaProduk,
    })
    setAddingSku(null)
    setSaving(false)
  }

  if (issues.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h3 className="text-sm font-medium">HPP Resolver</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Semua SKU sudah memiliki HPP. Tidak ada masalah yang perlu diresolve.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium">HPP Resolver — {issues.length} SKU tanpa HPP</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {issues.reduce((sum, i) => sum + i.qtyValidTerdampak, 0).toLocaleString("id-ID")} qty valid terdampak · Omzet terkait: {formatRupiah(issues.reduce((sum, i) => sum + i.omzetTerkait, 0))}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead className="text-right">Order</TableHead>
            <TableHead className="text-right">Qty Valid</TableHead>
            <TableHead className="text-right">Omzet Terkait</TableHead>
            <TableHead>Contoh No. Pesanan</TableHead>
            <TableHead className="w-24">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.skuNormalized}>
              <TableCell className="font-mono text-xs">{issue.sku}</TableCell>
              <TableCell className="text-sm max-w-[200px] truncate" title={issue.namaProduk}>{issue.namaProduk}</TableCell>
              <TableCell className="text-right text-xs">{issue.orderCount}</TableCell>
              <TableCell className="text-right text-xs">{issue.qtyValidTerdampak.toLocaleString("id-ID")}</TableCell>
              <TableCell className="text-right text-xs">{formatRupiah(issue.omzetTerkait)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {issue.contohNoPesanan.slice(0, 3).join(", ")}
                {issue.contohNoPesanan.length > 3 && ` +${issue.contohNoPesanan.length - 3}`}
              </TableCell>
              <TableCell>
                {addingSku === issue.skuNormalized ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={hppValue}
                      onChange={(e) => setHppValue(e.target.value)}
                      placeholder="HPP"
                      className="h-7 w-20 text-xs"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleSave(issue)} disabled={saving}>
                      {saving ? "..." : "Simpan"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingSku(null)}>Batal</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startAdd(issue)}>
                    <Plus className="size-3 mr-1" />Input HPP
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
