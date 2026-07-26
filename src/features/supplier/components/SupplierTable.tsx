"use client"

import { useState, useEffect } from "react";

/**
 * @module supplier/components/SupplierTable
 * Supplier Table — list of suppliers with search, filter by active status.
 *
 * Per PRD 5.13:
 *   - Nama, Kontak, Email, Produk (array), Lead Time, Aktif status
 *   - Search by nama/kontak/email
 *   - Filter by aktif status
 *   - Click to view detail + price history
 *
 * "use client" — client-side search/filter state.
 */


import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, Plus, Building2 } from "lucide-react"
import Link from "next/link"
import type { Supplier } from "../types"

/* ─── SupplierTable Component ─── */

interface SupplierTableProps {
  items: Supplier[]
}

export default function SupplierTable({ items }: SupplierTableProps) {
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [filtered, setFiltered] = useState<Supplier[]>(items)

  useEffect(() => {
    let result = items

    if (!showInactive) {
      result = result.filter((s) => s.aktif)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.kontak.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [search, showInactive, items])

  return (
    <Card>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama / kontak / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-muted-foreground">Tampilkan non-aktif</span>
        </label>
        <Link href="/supplier/new">
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Tambah Supplier
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada supplier"
          description={
            search || showInactive
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Belum ada supplier. Tambah supplier untuk mulai kelola harga pembelian."
          }
          icon={<Building2 className="size-8" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Supplier</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="text-center">Lead Time</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/supplier/${supplier.id}`}
                      className="text-primary hover:underline"
                    >
                      {supplier.nama}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{supplier.kontak || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{supplier.email || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.produk.slice(0, 3).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {supplier.produk.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supplier.produk.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {supplier.leadTimeHari} hari
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.aktif ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Non-aktif
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
