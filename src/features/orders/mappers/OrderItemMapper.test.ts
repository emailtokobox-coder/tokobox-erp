import { describe, it, expect } from "vitest"
import { mapOrderItem, mapOrderItems } from "@/features/orders/mappers/OrderItemMapper"
import type { RawOrderItem } from "@/features/orders/mappers/OrderItemMapper"

describe("mapOrderItem()", () => {
  it("maps a complete raw row to OrderItem", () => {
    const raw: RawOrderItem = {
      id: 1,
      store_id: "store-1",
      no_pesanan: "ORD-001",
      status_pesanan: "Selesai",
      waktu_pesanan_dibuat: "2025-01-15",
      sku: "LBM-100",
      nama_produk: "Lemari",
      nama_variasi: "Coklat",
      harga_awal: 100000,
      harga_setelah_diskon: 90000,
      qty_order: 2,
      qty_return: 0,
      qty_valid: 2,
      nilai_item_total: 180000,
      harga_per_qty: 90000,
      omzet_valid: 180000,
      omzet_retur: 0,
      hpp_per_sku: 50000,
      hpp_valid: 100000,
      hpp_retur: 0,
      status_item: "NORMAL",
      item_hash: "abc123",
      import_date: "2025-01-15",
    }
    const result = mapOrderItem(raw)
    expect(result.id).toBe(1)
    expect(result.storeId).toBe("store-1")
    expect(result.noPesanan).toBe("ORD-001")
    expect(result.statusItem).toBe("NORMAL")
    expect(result.skuNormalized).toBe("lbm-100")
    expect(result.hppValid).toBe(100000)
  })

  it("defaults missing fields to safe values", () => {
    const raw: RawOrderItem = {}
    const result = mapOrderItem(raw)
    expect(result.storeId).toBe("")
    expect(result.noPesanan).toBe("")
    expect(result.qtyOrder).toBe(0)
    expect(result.hppPerSku).toBeNull()
    expect(result.statusItem).toBe("NORMAL")
  })

  it("handles null optional fields", () => {
    const raw: RawOrderItem = {
      ekspedisi: null,
      kota: null,
      hpp_per_sku: null,
    }
    const result = mapOrderItem(raw)
    expect(result.ekspedisi).toBeUndefined()
    expect(result.kota).toBeUndefined()
    expect(result.hppPerSku).toBeNull()
  })

  it("derives skuNormalized from sku when not provided", () => {
    const raw: RawOrderItem = { sku: "LBM-100" }
    const result = mapOrderItem(raw)
    expect(result.skuNormalized).toBe("lbm-100")
  })
})

describe("mapOrderItems()", () => {
  it("maps an array of raw rows", () => {
    const raws: RawOrderItem[] = [
      { id: 1, no_pesanan: "ORD-1", sku: "LBM-100" },
      { id: 2, no_pesanan: "ORD-2", sku: "LBS-50" },
    ]
    const results = mapOrderItems(raws)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe(1)
    expect(results[1].id).toBe(2)
  })
})
