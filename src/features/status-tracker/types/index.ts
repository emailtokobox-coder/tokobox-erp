/**
 * @module status-tracker/types
 * Core types for the Status Tracker feature.
 */

// ─── Unified Order Card (for kanban/timeline) ───

export type OrderSource = "manual" | "shopee"

export interface UnifiedOrder {
  id: string
  source: OrderSource
  noOrder: string
  status: string
  columnId: string
  customer: string
  tanggal?: string
  total?: number
  tipe?: string
  itemCount?: number
}

// ─── Filter ───

export interface StatusTrackerFilter {
  dateFrom?: string
  dateTo?: string
  status?: string
  search?: string
  source?: OrderSource
}
