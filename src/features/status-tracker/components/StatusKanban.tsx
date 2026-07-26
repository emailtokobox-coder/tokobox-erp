"use client"

import { useMemo } from "react";

/**
 * @module status-tracker/components/StatusKanban
 * Kanban Board — horizontal columns showing orders by status.
 *
 * Per PRD 7.10:
 *   - Columns: Draft, Menunggu, Produksi, Siap Kirim, Terkirim, Lunas, Selesai
 *   - Drag-and-drop ready (cards rendered for future drag integration)
 *   - Shows order number, customer, total, source badge
 */


import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KANBAN_COLUMNS } from "@/features/status-tracker/constants/kanbanColumns"
import type { UnifiedOrder } from "@/features/status-tracker/types"

/* ─── Format Helpers ─── */

function formatRupiah(value?: number): string {
  if (!value) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
  } catch {
    return ""
  }
}

/* ─── Source Badge ─── */

function SourceBadge({ source }: { source: string }) {
  if (source === "manual") {
    return <Badge variant="secondary" className="text-xs">Manual</Badge>
  }
  return <Badge variant="outline" className="text-xs">Shopee</Badge>
}

/* ─── Order Card ─── */

function OrderCard({ order }: { order: UnifiedOrder }) {
  const href = order.source === "manual"
    ? `/manual-orders/${order.id}`
    : `/orders/${order.id}`

  return (
    <a href={href} className="block">
      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{
        borderLeftColor: order.columnId === "draft" ? "#737373"
          : order.columnId === "menunggu" ? "#d97706"
          : order.columnId === "produksi" ? "#2563eb"
          : order.columnId === "siap-kirim" ? "#4f46e5"
          : order.columnId === "terkirim" ? "#9333ea"
          : order.columnId === "lunas" ? "#16a34a"
          : "#059669"
      }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono font-medium truncate">{order.noOrder}</span>
          <SourceBadge source={order.source} />
        </div>
        <p className="text-sm font-medium truncate mb-1">{order.customer}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDate(order.tanggal)}</span>
          <span className="text-xs font-medium">{formatRupiah(order.total)}</span>
        </div>
        {order.itemCount !== undefined && order.itemCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{order.itemCount} item</p>
        )}
      </Card>
    </a>
  )
}

/* ─── Kanban Column ─── */

function KanbanColumn({ column, orders }: { column: typeof KANBAN_COLUMNS[0]; orders: UnifiedOrder[] }) {
  return (
    <div className="flex-shrink-0 w-64">
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${column.color}`}>
          {column.label}
        </span>
        <span className="text-xs text-muted-foreground">{orders.length}</span>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {orders.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            Belum ada pesanan
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={`${order.source}-${order.id}`} order={order} />
          ))
        )}
      </div>
    </div>
  )
}

/* ─── StatusKanban Component ─── */

interface StatusKanbanProps {
  orders: UnifiedOrder[]
}

export default function StatusKanban({ orders }: StatusKanbanProps) {
  const ordersByColumn = useMemo(() => {
    const grouped: Record<string, UnifiedOrder[]> = {}
    for (const col of KANBAN_COLUMNS) {
      grouped[col.id] = []
    }
    for (const order of orders) {
      const colId = order.columnId || "draft"
      if (!grouped[colId]) grouped[colId] = []
      grouped[colId].push(order)
    }
    return grouped
  }, [orders])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          orders={ordersByColumn[column.id] || []}
        />
      ))}
    </div>
  )
}
