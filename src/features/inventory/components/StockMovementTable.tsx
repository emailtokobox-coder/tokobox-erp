"use client"

import { useState } from "react";

/**
 * @module inventory/components/StockMovementTable
 * Stock Movement Table — displays stock movement history (Stok Masuk/Keluar).
 *
 * Per PRD 5.8:
 *   - Base Product, Tipe (MASUK/KELUAR), Tanggal, No Ref, Qty, Source, Supplier, Keterangan
 *
 * Auto-generated from imported Shopee orders (Iter 44):
 *   - qty_valid > 0 → KELUAR (items leaving warehouse)
 *   - qty_return > 0 → MASUK (items returning from customer)
 */

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Filter, Search, RotateCcw } from "lucide-react"
import type { StockMovement } from "../types"

interface StockMovementTableProps {
  items: StockMovement[]
}

/* ─── Filter State ─── */

interface MovementFilter {
  search: string
  tipe: string
  dateFrom: string
  dateTo: string
}

const DEFAULT_FILTER: MovementFilter = {
  search: "",
  tipe: "",
  dateFrom: "",
  dateTo: "",
}

export default function StockMovementTable({ items }: StockMovementTableProps) {
  const [filter, setFilter] = useState<MovementFilter>(DEFAULT_FILTER)
  const [showFilters, setShowFilters] = useState(false)

  /* --- Filtering --- */

  const filteredItems = items.filter((item) => {
    if (filter.tipe && item.tipe !== filter.tipe) return false
    if (filter.dateFrom && item.tanggal < filter.dateFrom) return false
    if (filter.dateTo && item.tanggal > filter.dateTo) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (
        !item.baseProduct.toLowerCase().includes(q) &&
        !item.noRef.toLowerCase().includes(q) &&
        !item.keterangan.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  const activeFilterCount = [filter.tipe, filter.dateFrom, filter.dateTo, filter.search].filter(Boolean).length

  const handleReset = () => {
    setFilter(DEFAULT_FILTER)
  }

  /* --- Render --- */

  return (
    <Card>
      {/* Header + Filter Toggle */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium">Pergerakan Stok</h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {activeFilterCount} filter aktif
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-3.5 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border-b bg-muted/30 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Cari</label>
              <div className="relative">
                <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
                <Input
                  value={filter.search}
                  onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="SKU, No. Pesanan, keterangan..."
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipe</label>
              <select
                value={filter.tipe}
                onChange={(e) => setFilter((prev) => ({ ...prev, tipe: e.target.value }))}
                className="h-8 w-36 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">Semua</option>
                <option value="MASUK">MASUK</option>
                <option value="KELUAR">KELUAR</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="h-8 w-32 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="h-8 w-32 text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="size-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total MASUK</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {filteredItems
              .filter((i) => i.tipe === "MASUK")
              .reduce((s, i) => s + i.qtyBaseUnit, 0)
              .toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total KELUAR</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
            {filteredItems
              .filter((i) => i.tipe === "KELUAR")
              .reduce((s, i) => s + i.qtyBaseUnit, 0)
              .toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Jumlah Transaksi</p>
          <p className="text-lg font-semibold">{filteredItems.length}</p>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Base Product (SKU)</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>No. Referensi</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                Belum ada data pergerakan stok. Data akan muncul otomatis setelah import pesanan dari Shopee.
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map((item, idx) => (
              <TableRow key={`${item.baseProduct}-${idx}`} className="text-xs">
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {item.tanggal || "-"}
                </TableCell>
                <TableCell className="font-mono font-medium">{item.baseProduct}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.tipe === "MASUK"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.tipe === "MASUK" ? "▲ MASUK" : "▼ KELUAR"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{item.qtyBaseUnit.toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-muted-foreground">{item.noRef || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.keterangan}>
                  {item.keterangan}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
