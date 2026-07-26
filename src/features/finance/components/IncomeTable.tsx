"use client"

import { useState, useEffect } from "react";

/**
 * @module finance/components/IncomeTable
 * Income Table — list of income records with filters and pagination.
 *
 * Per PRD 7.6:
 *   - No. Pesanan, Username Pembeli, Tanggal Dana Dilepaskan
 *   - Total Penghasilan, Metode Pembayaran
 *   - Match status (Sudah Cocok / Belum Ada Income)
 *   - Filter by date range
 *   - Search by No. Pesanan / Username
 *
 * "use client" — client-side search/filter state.
 */


import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, Wallet } from "lucide-react"
import type { IncomeRecord } from "../types"
import { formatRupiah } from "@/features/shared/utils/format"

/* ─── Status Badge ─── */

function IncomeStatusBadge() {
  // Income records in this table are already matched (they exist in the incomes table)
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Sudah Cocok
    </span>
  )
}

/* ─── IncomeTable Component ─── */

interface IncomeTableProps {
  items: IncomeRecord[]
}

export default function IncomeTable({ items }: IncomeTableProps) {
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filtered, setFiltered] = useState<IncomeRecord[]>(items)

  useEffect(() => {
    let result = items

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.noPesanan.toLowerCase().includes(q) ||
          r.usernamePembeli.toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter((r) => r.tanggalDanaDilepaskan >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((r) => r.tanggalDanaDilepaskan <= dateTo)
    }

    setFiltered(result)
  }, [search, dateFrom, dateTo, items])

  // Summary stats
  const totalIncome = filtered.reduce((sum, r) => sum + r.totalPenghasilan, 0)

  return (
    <Card>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari no. pesanan / pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 h-9 text-xs"
            placeholder="Dari"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 h-9 text-xs"
            placeholder="Sampai"
          />
        </div>
        {(dateFrom || dateTo || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setDateFrom(""); setDateTo("") }}
          >
            Reset
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{formatRupiah(totalIncome)}</span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada data income"
          description={
            search || dateFrom || dateTo
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Belum ada income yang di-import. Import file Income dari Shopee."
          }
          icon={<Wallet className="size-8" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">No. Pesanan</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead className="w-36">Tanggal Dana</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total Penghasilan</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => (
                <TableRow key={record.id ?? record.noPesanan}>
                  <TableCell className="font-mono text-xs">{record.noPesanan}</TableCell>
                  <TableCell className="text-sm">{record.usernamePembeli}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.tanggalDanaDilepaskan
                      ? new Date(record.tanggalDanaDilepaskan).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">{record.metodePembayaran || "-"}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatRupiah(record.totalPenghasilan)}
                  </TableCell>
                  <TableCell className="text-center">
                    <IncomeStatusBadge />
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
