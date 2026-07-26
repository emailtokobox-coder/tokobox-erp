"use client"

import { useState } from "react";

/**
 * @module inventory/components/StockSaldoTable
 * Stock Saldo Table — displays current stock balances per base product.
 *
 * Per PRD 7.4:
 *   - Base Product, Saldo, Last Updated
 *   - Summary bar: total produk, total saldo, last sync date
 *   - Sync button: triggers syncStockSaldoAction (Iter 45)
 *   - Status badge: Normal (>=0), Rendah (<=threshold), Kosong (=0)
 */

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import type { StockSaldo } from "../types"
import { updateStockSaldoAction, syncStockSaldoAction } from "../actions"

/* ─── Types ─── */

interface StockSaldoTableProps {
  items: StockSaldo[]
  lastSyncAt?: string | null
}

type SaldoStatus = "normal" | "rendah" | "kosong"

/**
 * Determine saldo status badge based on balance value.
 */
function getSaldoStatus(saldo: number): SaldoStatus {
  if (saldo === 0) return "kosong"
  if (saldo <= 0) return "rendah"
  return "normal"
}

const saldoStatusConfig: Record<SaldoStatus, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-emerald-100 text-emerald-700" },
  rendah: { label: "Rendah", className: "bg-amber-100 text-amber-700" },
  kosong: { label: "Kosong", className: "bg-red-100 text-red-700" },
}

export default function StockSaldoTable({ items, lastSyncAt }: StockSaldoTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [syncing, setSyncing] = useState(false)

  const handleSave = async (item: StockSaldo) => {
    await updateStockSaldoAction({ baseProduct: item.baseProduct, saldo: Number(editValue) || 0 })
    setEditingId(null)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncStockSaldoAction()
    } finally {
      setSyncing(false)
    }
  }

  /* ─── Summary stats ─── */

  const totalProduk = items.length
  const totalSaldo = items.reduce((sum, item) => sum + item.saldo, 0)
  const statusCounts: Record<SaldoStatus, number> = { normal: 0, rendah: 0, kosong: 0 }
  for (const item of items) {
    statusCounts[getSaldoStatus(item.saldo)]++
  }

  return (
    <Card>
      {/* ─── Header with summary bar ─── */}

      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Stok Saldo</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Menyinkronkan..." : "Sinkronisasi Saldo"}
          </Button>
        </div>

        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Total produk: <strong className="text-foreground">{totalProduk}</strong></span>
          <span>Total saldo: <strong className="text-foreground">{totalSaldo.toLocaleString("id-ID")}</strong></span>

          {lastSyncAt && (
            <span className="ml-auto">
              Terakhir sinkron: {new Date(lastSyncAt).toLocaleString("id-ID")}
            </span>
          )}

          {/* Status badges */}
          {totalProduk > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {([ "normal", "rendah", "kosong"] as SaldoStatus[]).map((status) => {
                const cfg = saldoStatusConfig[status]
                const count = statusCounts[status]
                if (count === 0) return null
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 ${cfg.className}`}
                  >
                    {cfg.label}: {count}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Table ─── */}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Base Product</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                Belum ada data stok saldo.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const status = getSaldoStatus(item.saldo)
              const cfg = saldoStatusConfig[status]

              if (editingId === item.id) {
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.baseProduct}</TableCell>
                    <TableCell className="text-right">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                        autoFocus
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" onClick={() => handleSave(item)}>Simpan</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Batal</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">-</TableCell>
                  </TableRow>
                )
              }

              return (
                <TableRow key={item.id ?? item.baseProduct}>
                  <TableCell className="font-mono text-xs">{item.baseProduct}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {item.saldo.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right">
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
