/**
 * @module orders/repositories
 * OrderRepository — data access layer for orders.
 *
 * This is a stub repository. In Phase 2+, this will connect to Supabase.
 * For now, it uses in-memory arrays as a placeholder.
 *
 * Architecture:
 *   UI → Actions → Services → Repositories → (Supabase)
 */

import type { OrderItem, OrderHeader } from "../types/OrderItem"
import type { OrderFilter } from "../types/OrderFilter"

// ─── In-memory store (placeholder) ───

const itemStore: OrderItem[] = []
const headerStore: OrderHeader[] = []

// ─── Repository Interface ───

export interface OrderRepository {
  // Items
  findItems(filter?: OrderFilter): Promise<OrderItem[]>
  findItemById(id: number): Promise<OrderItem | null>
  findItemsByOrder(noPesanan: string): Promise<OrderItem[]>
  insertItem(item: OrderItem): Promise<OrderItem>
  insertItems(items: OrderItem[]): Promise<OrderItem[]>

  // Headers
  findHeaders(filter?: OrderFilter): Promise<OrderHeader[]>
  findHeaderById(id: number): Promise<OrderHeader | null>
  findHeaderByNoPesanan(noPesanan: string): Promise<OrderHeader | null>
  insertHeader(header: OrderHeader): Promise<OrderHeader>
  insertHeaders(headers: OrderHeader[]): Promise<OrderHeader[]>
  updateHeader(id: number, data: Partial<OrderHeader>): Promise<OrderHeader | null>
  deleteHeader(id: number): Promise<boolean>

  // Bulk operations
  clearAll(): Promise<void>
}

// ─── Stub Implementation ───

export const OrderRepository: OrderRepository = {
  async findItems(filter?: OrderFilter): Promise<OrderItem[]> {
    let results = [...itemStore]
    if (filter?.noPesanan) {
      results = results.filter((i) => i.noPesanan === filter.noPesanan)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      results = results.filter(
        (i) =>
          i.noPesanan.toLowerCase().includes(q) ||
          i.namaProduk.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q)
      )
    }
    return results
  },

  async findItemById(id: number): Promise<OrderItem | null> {
    return itemStore.find((i) => i.id === id) ?? null
  },

  async findItemsByOrder(noPesanan: string): Promise<OrderItem[]> {
    return itemStore.filter((i) => i.noPesanan === noPesanan)
  },

  async insertItem(item: OrderItem): Promise<OrderItem> {
    itemStore.push(item)
    return item
  },

  async insertItems(items: OrderItem[]): Promise<OrderItem[]> {
    itemStore.push(...items)
    return items
  },

  async findHeaders(filter?: OrderFilter): Promise<OrderHeader[]> {
    let results = [...headerStore]
    if (filter?.noPesanan) {
      results = results.filter((h) => h.noPesanan === filter.noPesanan)
    }
    if (filter?.statusOrderFinal) {
      results = results.filter((h) => h.statusOrderFinal === filter.statusOrderFinal)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      results = results.filter(
        (h) =>
          h.noPesanan.toLowerCase().includes(q) ||
          h.usernamePembeli.toLowerCase().includes(q)
      )
    }
    return results
  },

  async findHeaderById(id: number): Promise<OrderHeader | null> {
    return headerStore.find((h) => h.id === id) ?? null
  },

  async findHeaderByNoPesanan(noPesanan: string): Promise<OrderHeader | null> {
    return headerStore.find((h) => h.noPesanan === noPesanan) ?? null
  },

  async insertHeader(header: OrderHeader): Promise<OrderHeader> {
    headerStore.push(header)
    return header
  },

  async insertHeaders(headers: OrderHeader[]): Promise<OrderHeader[]> {
    headerStore.push(...headers)
    return headers
  },

  async updateHeader(id: number, data: Partial<OrderHeader>): Promise<OrderHeader | null> {
    const idx = headerStore.findIndex((h) => h.id === id)
    if (idx === -1) return null
    headerStore[idx] = { ...headerStore[idx], ...data }
    return headerStore[idx]
  },

  async deleteHeader(id: number): Promise<boolean> {
    const idx = headerStore.findIndex((h) => h.id === id)
    if (idx === -1) return false
    headerStore.splice(idx, 1)
    return true
  },

  async clearAll(): Promise<void> {
    itemStore.length = 0
    headerStore.length = 0
  },
}
