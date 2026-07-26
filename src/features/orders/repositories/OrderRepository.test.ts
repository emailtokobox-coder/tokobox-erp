import { describe, it, expect, beforeEach } from "vitest"
import { OrderRepository, type OrderRepository as OrderRepositoryType } from "@/features/orders/repositories/OrderRepository"
import type { OrderItem, OrderHeader } from "@/features/orders/types/OrderItem"

// ─── Helpers ───

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: Math.floor(Math.random() * 1000),
    storeId: "store-1",
    noPesanan: "ORD-001",
    statusPesanan: "Selesai",
    waktuPesananDibuat: "2025-01-15",
    sku: "LBM-100",
    skuNormalized: "lbm-100",
    namaProduk: "Lemari",
    namaVariasi: "Coklat",
    hargaAwal: 100000,
    hargaSetelahDiskon: 90000,
    qtyOrder: 2,
    qtyReturn: 0,
    qtyValid: 2,
    nilaiItemTotal: 180000,
    hargaPerQty: 90000,
    omzetValid: 180000,
    omzetRetur: 0,
    hppPerSku: 50000,
    hppValid: 100000,
    hppRetur: 0,
    statusItem: "NORMAL",
    itemHash: "abc123",
    importDate: "2025-01-15",
    ...overrides,
  }
}

function makeHeader(overrides: Partial<OrderHeader> = {}): OrderHeader {
  return {
    id: Math.floor(Math.random() * 1000),
    storeId: "store-1",
    noPesanan: "ORD-001",
    statusPesanan: "Selesai",
    waktuPesananDibuat: "2025-01-15",
    waktuPembayaran: "",
    metodePembayaran: "",
    usernamePembeli: "buyer1",
    ekspedisi: undefined,
    kota: undefined,
    totalQtyOrder: 2,
    totalQtyReturn: 0,
    totalQtyValid: 2,
    totalOmzetValid: 180000,
    totalOmzetRetur: 0,
    totalHppValid: 100000,
    totalHppRetur: 0,
    statusOrderFinal: "Selesai / Normal",
    incomeAktual: null,
    statusIncome: "Belum Ada Income",
    totalPenyesuaian: 0,
    profitSebelumPenyesuaian: 0,
    profitSetelahPenyesuaian: 0,
    statusProfit: "Belum Ada Income",
    statusHpp: "HPP Lengkap",
    itemCount: 1,
    importDate: "2025-01-15",
    ...overrides,
  }
}

// Reset before each test
const repo = OrderRepository as OrderRepositoryType

beforeEach(async () => {
  await repo.clearAll()
})

// ─── Item CRUD ───

describe("OrderRepository — Items", () => {
  it("insertItem adds an item", async () => {
    const item = makeItem()
    const result = await repo.insertItem(item)
    expect(result).toBe(item)
    const found = await repo.findItems()
    expect(found).toHaveLength(1)
  })

  it("insertItems adds multiple items", async () => {
    const items = [makeItem({ noPesanan: "ORD-1" }), makeItem({ noPesanan: "ORD-2" })]
    await repo.insertItems(items)
    const found = await repo.findItems()
    expect(found).toHaveLength(2)
  })

  it("findItemById returns the correct item", async () => {
    const item = makeItem({ id: 42 })
    await repo.insertItem(item)
    const found = await repo.findItemById(42)
    expect(found).toBe(item)
  })

  it("findItemById returns null for missing id", async () => {
    const found = await repo.findItemById(999)
    expect(found).toBeNull()
  })

  it("findItemsByOrder filters by noPesanan", async () => {
    await repo.insertItems([
      makeItem({ noPesanan: "ORD-1" }),
      makeItem({ noPesanan: "ORD-2" }),
      makeItem({ noPesanan: "ORD-1" }),
    ])
    const found = await repo.findItemsByOrder("ORD-1")
    expect(found).toHaveLength(2)
  })

  it("findItems filters by search (noPesanan, namaProduk, sku)", async () => {
    await repo.insertItems([
      makeItem({ noPesanan: "ORD-1", namaProduk: "Lemari", sku: "LBM-100" }),
      makeItem({ noPesanan: "ORD-2", namaProduk: "Rak", sku: "RKS-50" }),
    ])
    const bySku = await repo.findItems({ search: "LBM" })
    expect(bySku).toHaveLength(1)
    const byName = await repo.findItems({ search: "Rak" })
    expect(byName).toHaveLength(1)
  })
})

// ─── Header CRUD ───

describe("OrderRepository — Headers", () => {
  it("insertHeader adds a header", async () => {
    const header = makeHeader()
    const result = await repo.insertHeader(header)
    expect(result).toBe(header)
    const found = await repo.findHeaders()
    expect(found).toHaveLength(1)
  })

  it("insertHeaders adds multiple headers", async () => {
    const headers = [makeHeader({ noPesanan: "ORD-1" }), makeHeader({ noPesanan: "ORD-2" })]
    await repo.insertHeaders(headers)
    const found = await repo.findHeaders()
    expect(found).toHaveLength(2)
  })

  it("findHeaderById returns the correct header", async () => {
    const header = makeHeader({ id: 42 })
    await repo.insertHeader(header)
    const found = await repo.findHeaderById(42)
    expect(found).toBe(header)
  })

  it("findHeaderByNoPesanan returns the correct header", async () => {
    const header = makeHeader({ noPesanan: "ORD-99" })
    await repo.insertHeader(header)
    const found = await repo.findHeaderByNoPesanan("ORD-99")
    expect(found).toBe(header)
  })

  it("updateHeader modifies the header", async () => {
    const header = makeHeader({ id: 1, statusOrderFinal: "Selesai / Normal" })
    await repo.insertHeader(header)
    const updated = await repo.updateHeader(1, { statusOrderFinal: "Retur Sebagian" })
    expect(updated?.statusOrderFinal).toBe("Retur Sebagian")
  })

  it("updateHeader returns null for missing id", async () => {
    const result = await repo.updateHeader(999, { statusOrderFinal: "Batal" })
    expect(result).toBeNull()
  })

  it("deleteHeader removes the header", async () => {
    const header = makeHeader({ id: 1 })
    await repo.insertHeader(header)
    const deleted = await repo.deleteHeader(1)
    expect(deleted).toBe(true)
    const found = await repo.findHeaderById(1)
    expect(found).toBeNull()
  })

  it("deleteHeader returns false for missing id", async () => {
    const deleted = await repo.deleteHeader(999)
    expect(deleted).toBe(false)
  })

  it("findHeaders filters by statusOrderFinal", async () => {
    await repo.insertHeaders([
      makeHeader({ noPesanan: "ORD-1", statusOrderFinal: "Selesai / Normal" }),
      makeHeader({ noPesanan: "ORD-2", statusOrderFinal: "Batal" }),
      makeHeader({ noPesanan: "ORD-3", statusOrderFinal: "Batal" }),
    ])
    const batal = await repo.findHeaders({ statusOrderFinal: "Batal" })
    expect(batal).toHaveLength(2)
  })

  it("clearAll empties both stores", async () => {
    await repo.insertItem(makeItem())
    await repo.insertHeader(makeHeader())
    await repo.clearAll()
    expect(await repo.findItems()).toHaveLength(0)
    expect(await repo.findHeaders()).toHaveLength(0)
  })
})
