/**
 * @module status-tracker/constants/kanbanColumns
 * Kanban column definitions for the Status Tracker board.
 *
 * Maps status values to kanban columns. Each column groups related statuses
 * from both Shopee orders and manual orders.
 */

import type { ManualOrderStatus } from "@/features/manual-orders"

// ─── Manual order statuses that map to kanban columns ───

const MANUAL_STATUS_MAP: Record<string, string> = {
  Draft: "draft",
  Invoice_Terkirim: "menunggu",
  Menunggu_Pembayaran_DP: "menunggu",
  DP_Lunas: "menunggu",
  Pelunasan_Diminta: "menunggu",
  Pelunasan_Diterima: "menunggu",
  ACC_Termin: "menunggu",
  Kirim_Invoice_Tagihan: "menunggu",
  Produksi: "produksi",
  Siap_Kirim: "siap-kirim",
  Terkirim: "terkirim",
  Lunas: "lunas",
  Selesai: "selesai",
}

// ─── Shopee order statuses that map to kanban columns ───

const SHOPEE_STATUS_MAP: Record<string, string> = {
  "Selesai / Normal": "selesai",
  "Retur Sebagian": "retur",
  "Retur Full": "retur",
  Batal: "batal",
}

// ─── Column Definitions ───

export interface KanbanColumn {
  id: string
  label: string
  color: string
  statuses: string[]
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "draft",
    label: "Draft",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    statuses: ["Draft"],
  },
  {
    id: "menunggu",
    label: "Menunggu",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    statuses: ["Invoice_Terkirim", "Menunggu_Pembayaran_DP", "DP_Lunas", "Pelunasan_Diminta", "Pelunasan_Diterima", "ACC_Termin", "Kirim_Invoice_Tagihan"],
  },
  {
    id: "produksi",
    label: "Produksi",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    statuses: ["Produksi"],
  },
  {
    id: "siap-kirim",
    label: "Siap Kirim",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    statuses: ["Siap_Kirim"],
  },
  {
    id: "terkirim",
    label: "Terkirim",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    statuses: ["Terkirim"],
  },
  {
    id: "lunas",
    label: "Lunas",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    statuses: ["Lunas", "DP_Lunas", "Pelunasan_Diterima"],
  },
  {
    id: "selesai",
    label: "Selesai",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    statuses: ["Selesai", "Selesai / Normal"],
  },
]

/** Map a manual order status to a kanban column id. */
export function mapManualStatusToColumn(status: ManualOrderStatus): string {
  return MANUAL_STATUS_MAP[status] ?? "draft"
}

/** Map a Shopee order status to a kanban column id. */
export function mapShopeeStatusToColumn(status: string): string {
  return SHOPEE_STATUS_MAP[status] ?? "draft"
}
