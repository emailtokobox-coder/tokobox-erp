"use client"

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * @module supplier/components/SupplierDetail
 * Supplier Detail — detail view with price history table.
 *
 * Per PRD 5.13, 5.14:
 *   - Display supplier info
 *   - Price history table (base_product, harga_beli, berlaku_mulai)
 *   - Add new price entry form
 *
 * "use client" — client-side state + add price form.
 */


import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatRupiah } from "@/features/shared/utils/format"
import { Plus, Package } from "lucide-react"
import type { Supplier, SupplierPrice } from "../types"

/* ─── SupplierDetail Component ─── */

interface SupplierDetailProps {
  supplier: Supplier
  prices: SupplierPrice[]
  onAddPrice: (data: { baseProduct: string; hargaBeli: number; berlakuMulai: string; catatan?: string }) => Promise<void>
}

export default function SupplierDetail({ supplier, prices, onAddPrice }: SupplierDetailProps) {
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [baseProduct, setBaseProduct] = useState("")
  const [hargaBeli, setHargaBeli] = useState("")
  const [berlakuMulai, setBerlakuMulai] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [catatan, setCatatan] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAddPrice = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onAddPrice({
        baseProduct,
        hargaBeli: Number(hargaBeli) || 0,
        berlakuMulai,
        catatan,
      })
      setBaseProduct("")
      setHargaBeli("")
      setBerlakuMulai(new Date().toISOString().split("T")[0])
      setCatatan("")
      setShowAddPrice(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Supplier Info */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{supplier.nama}</h2>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {supplier.kontak && <p>Kontak: {supplier.kontak}</p>}
              {supplier.email && <p>Email: {supplier.email}</p>}
              {supplier.alamat && <p>Alamat: {supplier.alamat}</p>}
              <p>Lead Time: {supplier.leadTimeHari} hari</p>
              <p>
                Status:{" "}
                {supplier.aktif ? (
                  <Badge variant="default" className="text-xs">Aktif</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Non-aktif</Badge>
                )}
              </p>
              {supplier.catatan && <p>Catatan: {supplier.catatan}</p>}
            </div>
            {supplier.produk.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {supplier.produk.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Price History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Package className="size-4" />
            Riwayat Harga Pembelian
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddPrice(!showAddPrice)}
          >
            <Plus className="size-4 mr-1" />
            Tambah Harga
          </Button>
        </div>

        {/* Add Price Form */}
        {showAddPrice && (
          <form onSubmit={handleAddPrice} className="mb-4 p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="baseProduct" className="text-xs">Base Product</Label>
                <Input
                  id="baseProduct"
                  value={baseProduct}
                  onChange={(e) => setBaseProduct(e.target.value.toUpperCase())}
                  placeholder="LB"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hargaBeli" className="text-xs">Harga Beli (Rp)</Label>
                <Input
                  id="hargaBeli"
                  type="number"
                  value={hargaBeli}
                  onChange={(e) => setHargaBeli(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="berlakuMulai" className="text-xs">Berlaku Mulai</Label>
                <Input
                  id="berlakuMulai"
                  type="date"
                  value={berlakuMulai}
                  onChange={(e) => setBerlakuMulai(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="catatan" className="text-xs">Catatan</Label>
              <Input
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Opsional"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Harga"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAddPrice(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Price Table */}
        {prices.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Belum ada riwayat harga.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base Product</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-center">Berlaku Mulai</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-mono text-xs">{price.baseProduct}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatRupiah(price.hargaBeli)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {price.berlakuMulai
                        ? new Date(price.berlakuMulai).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {price.catatan || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
