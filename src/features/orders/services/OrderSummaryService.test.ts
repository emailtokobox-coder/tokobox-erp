import { describe, it, expect, beforeEach } from "vitest"
import { orderSummaryService } from "@/features/orders/services/OrderSummaryService"
import type { OrderItem, OrderHeader, IncomeRecord, AdjustmentRecord, HppSku } from "@/features/orders/types/OrderItem"

// ─── Helpers ───

interface RawItem {
  noPesanan: string
  sku: string
  namaProduk: string
  namaVariasi: string
  hargaAsli: number
  hargaSetelahDiskon: number
  qtyOrder: number
  qtyReturn: number
  subtotalPesanan: number
  statusPesanan: string
  hppPerSku: number | null
}

function makeRawItem(overrides: Partial<RawItem> = {}): RawItem {
  return {
    noPesanan: "ORD-1",
    sku: "LBM-100",
    namaProduk: "Lemari",
    namaVariasi: "Coklat",
    hargaAsli: 100000,
    hargaSetelahDiskon: 90000,
    qtyOrder: 2,
    qtyReturn: 0,
    subtotalPesanan: 180000,
    statusPesanan: "Selesai",
    hppPerSku: 50000,
    ...overrides,
  }
}

// ─── Tests ───

describe("OrderSummaryService", () => {
  beforeEach(async () => {
    const repo = (await import("@/features/orders/repositories/OrderRepository")).OrderRepository as typeof import("@/features/orders/repositories/OrderRepository").OrderRepository
    await repo.clearAll()
  })

  describe("processOrderItems()", () => {
    it("processes raw items into OrderItem and OrderHeader", async () => {
      const rawItems = [makeRawItem(), makeRawItem({ noPesanan: "ORD-2", sku: "LBS-50" })]
      const result = await orderSummaryService.processOrderItems(rawItems, "store-1")
      expect(result.items).toHaveLength(2)
      expect(result.headers).toHaveLength(2) // different noPesanan
      expect(result.items[0].statusItem).toBe("NORMAL")
      expect(result.headers[0].totalQtyValid).toBe(2)
    })

    it("groups items by noPesanan into headers", async () => {
      const rawItems = [
        makeRawItem({ noPesanan: "ORD-1" }),
        makeRawItem({ noPesanan: "ORD-1" }),
        makeRawItem({ noPesanan: "ORD-2" }),
      ]
      const result = await orderSummaryService.processOrderItems(rawItems, "store-1")
      expect(result.headers).toHaveLength(2)
      expect(result.headers[0].itemCount).toBe(2)
      expect(result.headers[1].itemCount).toBe(1)
    })

    it("returns BATAL status for cancelled orders", async () => {
      const rawItems = [makeRawItem({ statusPesanan: "Batal" })]
      const result = await orderSummaryService.processOrderItems(rawItems, "store-1")
      expect(result.items[0].statusItem).toBe("BATAL")
      expect(result.items[0].omzetValid).toBe(0)
      expect(result.headers[0].statusOrderFinal).toBe("Batal")
    })
  })

  describe("matchIncomeToOrders()", () => {
    it("matches income and recalculates profit", async () => {
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
      const result = await orderSummaryService.matchIncomeToOrders(headers, incomes)
      expect(result[0].incomeAktual).toBe(300000)
      expect(result[0].profitSebelumPenyesuaian).toBe(200000)
      expect(result[0].statusIncome).toBe("Sudah Cocok")
    })
  })

  describe("matchAdjustmentToOrders()", () => {
    it("aggregates adjustments and recalculates profit", async () => {
      const headers: OrderHeader[] = [
        {
          storeId: "s1",
          noPesanan: "ORD-1",
          statusPesanan: "Selesai",
          statusOrderFinal: "Selesai / Normal",
          statusHpp: "HPP Lengkap",
          statusIncome: "Sudah Cocok",
          statusProfit: "Sudah Dihitung",
          totalHppValid: 100000,
          totalHppRetur: 0,
          incomeAktual: 300000,
          profitSebelumPenyesuaian: 200000,
          profitSetelahPenyesuaian: 200000,
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
      const result = await orderSummaryService.matchAdjustmentToOrders(headers, adjustments)
      expect(result[0].totalPenyesuaian).toBe(25000)
      expect(result[0].profitSetelahPenyesuaian).toBe(225000)
    })
  })

  describe("applyHppMap()", () => {
    it("applies HPP to items with matching SKU", async () => {
      const items: OrderItem[] = [
        {
          id: 1, storeId: "s1", noPesanan: "ORD-1", statusPesanan: "Selesai",
          waktuPesananDibuat: "", sku: "LBM-100", skuNormalized: "lbm-100",
          namaProduk: "Lemari", namaVariasi: "Coklat", hargaAwal: 100000,
          hargaSetelahDiskon: 90000, qtyOrder: 2, qtyReturn: 0, qtyValid: 2,
          nilaiItemTotal: 180000, hargaPerQty: 90000, omzetValid: 180000,
          omzetRetur: 0, hppPerSku: null, hppValid: 0, hppRetur: 0,
          statusItem: "NORMAL", itemHash: "", importDate: "",
        },
      ]
      const hppMap = new Map<string, HppSku>([
        ["lbm-100", { storeId: "s1", sku: "LBM-100", skuNormalized: "lbm-100", hpp: 45000, updatedAt: "" }],
      ])
      const result = await orderSummaryService.applyHppMap(items, hppMap)
      expect(result[0].hppPerSku).toBe(45000)
      expect(result[0].hppValid).toBe(90000)
    })
  })

  describe("resolveMissingHpp()", () => {
    it("returns HPP issues for items without HPP", async () => {
      const items: OrderItem[] = [
        {
          id: 1, storeId: "s1", noPesanan: "ORD-1", statusPesanan: "Selesai",
          waktuPesananDibuat: "", sku: "LBM-100", skuNormalized: "lbm-100",
          namaProduk: "Lemari", namaVariasi: "Coklat", hargaAwal: 100000,
          hargaSetelahDiskon: 90000, qtyOrder: 2, qtyReturn: 0, qtyValid: 2,
          nilaiItemTotal: 180000, hargaPerQty: 90000, omzetValid: 180000,
          omzetRetur: 0, hppPerSku: null, hppValid: 0, hppRetur: 0,
          statusItem: "NORMAL", itemHash: "", importDate: "",
        },
      ]
      const issues = await orderSummaryService.resolveMissingHpp(items)
      expect(issues).toHaveLength(1)
      expect(issues[0].skuNormalized).toBe("lbm-100")
    })
  })

  describe("buildDashboardSummary()", () => {
    it("aggregates KPIs from headers", async () => {
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
      ]
      const summary = await orderSummaryService.buildDashboardSummary(headers)
      expect(summary.totalOrder).toBe(1)
      expect(summary.totalOmzet).toBe(300000)
      expect(summary.profitMargin).toBeCloseTo(50, 1)
    })
  })

  describe("saveOrders() / loadOrders()", () => {
    it("saves and loads orders from repository", async () => {
      const rawItems = [makeRawItem({ noPesanan: "ORD-1" })]
      const { items, headers } = await orderSummaryService.processOrderItems(rawItems, "store-1")
      await orderSummaryService.saveOrders(items, headers)

      const loaded = await orderSummaryService.loadOrders()
      expect(loaded.items).toHaveLength(1)
      expect(loaded.headers).toHaveLength(1)
      expect(loaded.items[0].noPesanan).toBe("ORD-1")
    })
  })
})
