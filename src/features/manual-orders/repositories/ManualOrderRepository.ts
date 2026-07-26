/**
 * @module manual-orders/repositories/ManualOrderRepository
 * Repository interface + in-memory stub for manualOrders table.
 *
 * Per PRD Section 5.15 (manualOrders table).
 *
 * Architecture:
 *   Actions → ManualOrderRepository → (stub | ManualOrderSupabaseRepository) → Supabase
 */

import type { ManualOrder } from "../types/ManualOrder"
import type { ManualOrderFilter } from "../types/ManualOrderFilter"

// ─── In-memory store (placeholder) ───

const orderStore: ManualOrder[] = []

// ─── Repository Interface ───

export interface ManualOrderRepository {
  findAll(filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }>
  findById(id: string): Promise<ManualOrder | null>
  findByNoManualOrder(noManualOrder: string): Promise<ManualOrder | null>
  findByStoreId(storeId: string, filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }>
  create(data: Partial<ManualOrder>): Promise<ManualOrder>
  update(id: string, data: Partial<ManualOrder>): Promise<ManualOrder | null>
  delete(id: string): Promise<boolean>
}

// ─── Stub Implementation ───

export const ManualOrderRepository: ManualOrderRepository = {
  async findAll(filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }> {
    let results = [...orderStore]
    if (filter?.tipe) {
      results = results.filter((o) => o.tipePesanan === filter.tipe)
    }
    if (filter?.status) {
      results = results.filter((o) => o.statusOrder === filter.status)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      results = results.filter(
        (o) =>
          o.noManualOrder.toLowerCase().includes(q) ||
          o.namaPelanggan.toLowerCase().includes(q)
      )
    }
    if (filter?.dateFrom) {
      results = results.filter((o) => (o.createdAt ?? "") >= filter.dateFrom!)
    }
    if (filter?.dateTo) {
      results = results.filter((o) => (o.createdAt ?? "") <= filter.dateTo!)
    }
    const page = filter?.page ?? 1
    const pageSize = filter?.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize
    return { orders: results.slice(from, to), total: results.length, page, pageSize }
  },

  async findById(id: string): Promise<ManualOrder | null> {
    return orderStore.find((o) => o.id === id) ?? null
  },

  async findByNoManualOrder(noManualOrder: string): Promise<ManualOrder | null> {
    return orderStore.find((o) => o.noManualOrder === noManualOrder) ?? null
  },

  async findByStoreId(storeId: string, filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }> {
    let results = orderStore.filter((o) => o.storeId === storeId)
    if (filter?.tipe) {
      results = results.filter((o) => o.tipePesanan === filter.tipe)
    }
    if (filter?.status) {
      results = results.filter((o) => o.statusOrder === filter.status)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      results = results.filter(
        (o) =>
          o.noManualOrder.toLowerCase().includes(q) ||
          o.namaPelanggan.toLowerCase().includes(q)
      )
    }
    const page = filter?.page ?? 1
    const pageSize = filter?.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize
    return { orders: results.slice(from, to), total: results.length, page, pageSize }
  },

  async create(data: Partial<ManualOrder>): Promise<ManualOrder> {
    const order: ManualOrder = {
      storeId: data.storeId ?? "",
      noManualOrder: data.noManualOrder ?? "",
      tipePesanan: data.tipePesanan ?? "MANUAL_CASH",
      statusOrder: data.statusOrder ?? "Draft",
      metodePembayaran: data.metodePembayaran ?? "cash",
      namaPelanggan: data.namaPelanggan ?? "",
      alamat: data.alamat ?? "",
      noHp: data.noHp ?? "",
      ekspedisi: data.ekspedisi ?? "",
      biayaOngkir: data.biayaOngkir ?? 0,
      diskonPersen: data.diskonPersen ?? 0,
      diskonNominal: data.diskonNominal ?? 0,
      pajak: data.pajak ?? 0,
      total: data.total ?? 0,
      totalBayar: data.totalBayar ?? 0,
      sisaPembayaran: data.sisaPembayaran ?? 0,
      dpPersentase: data.dpPersentase,
      dpNominal: data.dpNominal,
      terminSchedule: data.terminSchedule ?? [],
      items: data.items ?? [],
      subtotal: data.subtotal ?? 0,
      catatan: data.catatan ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ManualOrder
    orderStore.push(order)
    return order
  },

  async update(id: string, data: Partial<ManualOrder>): Promise<ManualOrder | null> {
    const idx = orderStore.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orderStore[idx] = { ...orderStore[idx], ...data, updatedAt: new Date().toISOString() }
    return orderStore[idx]
  },

  async delete(id: string): Promise<boolean> {
    const idx = orderStore.findIndex((o) => o.id === id)
    if (idx === -1) return false
    orderStore.splice(idx, 1)
    return true
  },
}
