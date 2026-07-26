import { describe, it, expect } from "vitest"
import {
  calculateItem,
  buildOrderHeaders,
  matchIncome,
  matchAdjustment,
  applyHppToItems,
  buildHppResolver,
  buildSummary,
} from "@/features/orders/domain/OrderCalculator"
import type { OrderItem, OrderHeader, IncomeRecord, AdjustmentRecord, HppSku } from "@/features/orders/types/OrderItem"

// ─── Helpers ───

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    storeId: "default",
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

// ─── calculateItem ───

describe("calculateItem()", () => {
  it("returns NORMAL when qtyReturn is 0", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 0, 180000, "Selesai", 50000
    )
    expect(result.statusItem).toBe("NORMAL")
    expect(result.qtyValid).toBe(2)
    expect(result.omzetValid).toBe(180000)
    expect(result.hppValid).toBe(100000)
  })

  it("returns PARTIAL_RETURN when some items returned", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 4, 1, 360000, "Selesai", 50000
    )
    expect(result.statusItem).toBe("PARTIAL_RETURN")
    expect(result.qtyReturn).toBe(1)
    expect(result.qtyValid).toBe(3)
    expect(result.omzetValid).toBe(270000)
  })

  it("returns FULL_RETURN when all items returned", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 2, 180000, "Selesai", 50000
    )
    expect(result.statusItem).toBe("FULL_RETURN")
    expect(result.qtyValid).toBe(0)
  })

  it("returns BATAL and zeros when status is Batal", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 0, 180000, "Batal", 50000
    )
    expect(result.statusItem).toBe("BATAL")
    expect(result.omzetValid).toBe(0)
    expect(result.hppValid).toBe(0)
  })

  it("caps qtyReturn at qtyOrder", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 5, 180000, "Selesai", 50000
    )
    expect(result.qtyReturn).toBe(2)
    expect(result.qtyValid).toBe(0)
    expect(result.statusItem).toBe("FULL_RETURN")
  })

  it("handles hppPerSku null", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 0, 180000, "Selesai", null
    )
    expect(result.hppValid).toBe(0)
    expect(result.hppPerSku).toBeNull()
  })

  it("sets skuNormalized to lowercase trimmed", () => {
    const result = calculateItem(
      "ORD-001", "LBM-100", "Lemari", "Coklat", 100000, 90000, 2, 0, 180000, "Selesai", 50000
    )
    expect(result.skuNormalized).toBe("lbm-100")
  })
})

// ─── buildOrderHeaders ───

describe("buildOrderHeaders()", () => {
  it("groups items by noPesanan", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", qtyValid: 2 }),
      makeItem({ noPesanan: "ORD-2", qtyValid: 1 }),
      makeItem({ noPesanan: "ORD-1", qtyValid: 3 }),
    ]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers).toHaveLength(2)
    expect(headers[0].totalQtyValid).toBe(5)
    expect(headers[1].totalQtyValid).toBe(1)
  })

  it("sets Selesai / Normal for non-cancelled orders", () => {
    const items = [makeItem({ statusPesanan: "Selesai", qtyValid: 2, qtyReturn: 0 })]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers[0].statusOrderFinal).toBe("Selesai / Normal")
  })

  it("sets Batal for cancelled orders and zeros out omzet/HPP", () => {
    const items = [makeItem({ statusPesanan: "Batal", omzetValid: 100000, hppValid: 50000 })]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers[0].statusOrderFinal).toBe("Batal")
    expect(headers[0].totalOmzetValid).toBe(0)
    expect(headers[0].totalHppValid).toBe(0)
  })

  it("sets Retur Sebagian for partial returns", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", qtyValid: 3, qtyReturn: 1 }),
    ]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers[0].statusOrderFinal).toBe("Retur Sebagian")
  })

  it("sets Retur Full when all items returned", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", qtyValid: 0, qtyReturn: 2 }),
    ]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers[0].statusOrderFinal).toBe("Retur Full")
  })

  it("sets HPP status correctly", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", hppPerSku: 50000 }),
      makeItem({ noPesanan: "ORD-1", hppPerSku: null }),
    ]
    const headers = buildOrderHeaders(items, "store-1")
    expect(headers[0].statusHpp).toBe("HPP Sebagian")
  })
})

// ─── matchIncome ───

describe("matchIncome()", () => {
  it("matches income to order and recalculates profit", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Selesai",
        statusOrderFinal: "Selesai / Normal",
        statusHpp: "HPP Lengkap",
        statusIncome: "Belum Ada Income",
        statusProfit: "Belum Ada Income",
        totalHppValid: 100000,
        totalHppRetur: 0,
        incomeAktual: null,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        totalPenyesuaian: 0,
        totalOmzetValid: 0,
        totalOmzetRetur: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        itemCount: 1,
        importDate: "",
      },
    ]
    const incomes: IncomeRecord[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        totalPenghasilan: 300000,
        importDate: "",
        usernamePembeli: "",
        waktuPesananDibuat: "",
        metodePembayaran: "Transfer",
        tanggalDanaDilepaskan: "2025-01-20",
        hargaAsliProduk: 0,
        totalDiskonProduk: 0,
        pengembalianDana: 0,
        diskonDariShopee: 0,
        voucherPenjual: 0,
        ongkirDibayarPembeli: 0,
        gratisOngkirShopee: 0,
        biayaAdministrasi: 0,
        biayaLayanan: 0,
        biayaProsesPesanan: 0,
        biayaKomisiAms: 0,
      },
    ]
    const result = matchIncome(headers, incomes)
    expect(result[0].incomeAktual).toBe(300000)
    expect(result[0].profitSebelumPenyesuaian).toBe(200000)
    expect(result[0].statusIncome).toBe("Sudah Cocok")
  })

  it("returns unchanged header when no matching income", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Selesai",
        totalHppValid: 100000,
        totalHppRetur: 0,
        incomeAktual: null,
        statusIncome: "Belum Ada Income",
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        statusProfit: "Belum Ada Income",
        totalOmzetValid: 0,
        totalOmzetRetur: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        totalPenyesuaian: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        statusOrderFinal: "Selesai / Normal",
        statusHpp: "HPP Lengkap",
        itemCount: 1,
        importDate: "",
      },
    ]
    const result = matchIncome(headers, [])
    expect(result[0]).toBe(headers[0])
  })
})

// ─── matchAdjustment ───

describe("matchAdjustment()", () => {
  it("aggregates adjustments by noPesanan and recalculates profit", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Selesai",
        totalHppValid: 100000,
        totalHppRetur: 0,
        incomeAktual: 300000,
        totalPenyesuaian: 0,
        profitSebelumPenyesuaian: 200000,
        profitSetelahPenyesuaian: 200000,
        statusIncome: "Sudah Cocok",
        statusProfit: "Sudah Dihitung",
        totalOmzetValid: 0,
        totalOmzetRetur: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        statusOrderFinal: "Selesai / Normal",
        statusHpp: "HPP Lengkap",
        itemCount: 1,
        importDate: "",
      },
    ]
    const adjustments: AdjustmentRecord[] = [
      {
        storeId: "s1",
        noPesananTerhubung: "ORD-1",
        biayaPenyesuaian: 25000,
        importDate: "",
        tanggalAdjustment: "",
        tipeAdjustment: "ongkir",
      },
    ]
    const result = matchAdjustment(headers, adjustments)
    expect(result[0].totalPenyesuaian).toBe(25000)
    expect(result[0].profitSetelahPenyesuaian).toBe(225000)
  })

  it("skips cancelled orders", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Batal",
        totalHppValid: 0,
        totalHppRetur: 0,
        incomeAktual: null,
        totalPenyesuaian: 0,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        statusIncome: "Tidak Perlu Income",
        statusProfit: "Tidak Dihitung",
        totalOmzetValid: 0,
        totalOmzetRetur: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        statusOrderFinal: "Batal",
        statusHpp: "Tidak Perlu HPP / Batal",
        itemCount: 1,
        importDate: "",
      },
    ]
    const adjustments: AdjustmentRecord[] = [
      {
        storeId: "s1",
        noPesananTerhubung: "ORD-1",
        biayaPenyesuaian: 50000,
        importDate: "",
        tanggalAdjustment: "",
        tipeAdjustment: "ongkir",
      },
    ]
    const result = matchAdjustment(headers, adjustments)
    expect(result[0].totalPenyesuaian).toBe(0)
  })
})

// ─── applyHppToItems ───

describe("applyHppToItems()", () => {
  it("applies HPP to items with matching SKU", () => {
    const items: OrderItem[] = [
      makeItem({ sku: "LBM-100", hppPerSku: null, hppValid: 0 }),
    ]
    const hppMap = new Map<string, HppSku>([
      ["lbm-100", { storeId: "s1", sku: "LBM-100", skuNormalized: "lbm-100", hpp: 45000, updatedAt: "" }],
    ])
    const result = applyHppToItems(items, hppMap)
    expect(result[0].hppPerSku).toBe(45000)
    expect(result[0].hppValid).toBe(90000)
  })

  it("sets omzetValid to 0 for BATAL items but still calculates hppValid", () => {
    const items: OrderItem[] = [
      makeItem({ statusItem: "BATAL", omzetValid: 0, hppValid: 0 }),
    ]
    const hppMap = new Map<string, HppSku>([
      ["lbm-100", { storeId: "s1", sku: "LBM-100", skuNormalized: "lbm-100", hpp: 45000, updatedAt: "" }],
    ])
    const result = applyHppToItems(items, hppMap)
    expect(result[0].omzetValid).toBe(0)
    expect(result[0].hppValid).toBe(90000) // hppPerSku * qtyValid (cost still tracked)
  })

  it("returns unchanged items with no matching HPP", () => {
    const items: OrderItem[] = [
      makeItem({ hppPerSku: null, hppValid: 0 }),
    ]
    const hppMap = new Map<string, HppSku>()
    const result = applyHppToItems(items, hppMap)
    expect(result[0]).toBe(items[0])
  })
})

// ─── buildHppResolver ───

describe("buildHppResolver()", () => {
  it("returns empty array when all items have HPP", () => {
    const items = [
      makeItem({ hppPerSku: 50000, qtyValid: 2 }),
    ]
    expect(buildHppResolver(items)).toHaveLength(0)
  })

  it("groups missing HPP by SKU", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", sku: "LBM-100", skuNormalized: "lbm-100", hppPerSku: null, qtyValid: 2, omzetValid: 180000 }),
      makeItem({ noPesanan: "ORD-2", sku: "LBM-100", skuNormalized: "lbm-100", hppPerSku: null, qtyValid: 1, omzetValid: 90000 }),
      makeItem({ noPesanan: "ORD-3", sku: "LBS-50", skuNormalized: "lbs-50", hppPerSku: null, qtyValid: 3, omzetValid: 270000 }),
    ]
    const issues = buildHppResolver(items)
    expect(issues).toHaveLength(2)
    const lbm = issues.find((i) => i.skuNormalized === "lbm-100")!
    expect(lbm.orderCount).toBe(2)
    expect(lbm.qtyValidTerdampak).toBe(3)
    expect(lbm.omzetTerkait).toBe(270000)
  })

  it("skips BATAL and zero-qty items", () => {
    const items = [
      makeItem({ statusItem: "BATAL", qtyValid: 0, hppPerSku: null }),
      makeItem({ qtyValid: 0, hppPerSku: null }),
    ]
    expect(buildHppResolver(items)).toHaveLength(0)
  })
})

// ─── buildSummary ───

describe("buildSummary()", () => {
  it("aggregates KPIs correctly", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Selesai",
        statusOrderFinal: "Selesai / Normal",
        statusHpp: "HPP Lengkap",
        statusIncome: "Sudah Cocok",
        statusProfit: "Sudah Dihitung",
        totalOmzetValid: 300000,
        totalHppValid: 150000,
        totalHppRetur: 0,
        incomeAktual: 300000,
        profitSebelumPenyesuaian: 150000,
        profitSetelahPenyesuaian: 150000,
        totalPenyesuaian: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        totalOmzetRetur: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        itemCount: 1,
        importDate: "",
      },
      {
        storeId: "s1",
        noPesanan: "ORD-2",
        statusPesanan: "Selesai",
        statusOrderFinal: "Batal",
        statusHpp: "Tidak Perlu HPP / Batal",
        statusIncome: "Tidak Perlu Income",
        statusProfit: "Tidak Dihitung",
        totalOmzetValid: 0,
        totalHppValid: 0,
        totalHppRetur: 0,
        incomeAktual: null,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        totalPenyesuaian: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        totalOmzetRetur: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        itemCount: 1,
        importDate: "",
      },
    ]
    const summary = buildSummary(headers)
    expect(summary.totalOrder).toBe(2)
    expect(summary.orderNormal).toBe(1)
    expect(summary.orderBatal).toBe(1)
    expect(summary.totalOmzet).toBe(300000)
    expect(summary.profitMargin).toBeCloseTo(50, 1)
  })

  it("returns 0% profit margin when omzet is 0", () => {
    const headers: OrderHeader[] = [
      {
        storeId: "s1",
        noPesanan: "ORD-1",
        statusPesanan: "Batal",
        statusOrderFinal: "Batal",
        statusHpp: "Tidak Perlu HPP / Batal",
        statusIncome: "Tidak Perlu Income",
        statusProfit: "Tidak Dihitung",
        totalOmzetValid: 0,
        totalHppValid: 0,
        totalHppRetur: 0,
        incomeAktual: null,
        profitSebelumPenyesuaian: 0,
        profitSetelahPenyesuaian: 0,
        totalPenyesuaian: 0,
        totalQtyOrder: 0,
        totalQtyReturn: 0,
        totalQtyValid: 0,
        totalOmzetRetur: 0,
        waktuPesananDibuat: "",
        waktuPembayaran: "",
        metodePembayaran: "",
        usernamePembeli: "",
        ekspedisi: undefined,
        kota: undefined,
        itemCount: 1,
        importDate: "",
      },
    ]
    const summary = buildSummary(headers)
    expect(summary.profitMargin).toBe(0)
  })
})
