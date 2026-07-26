import { describe, it, expect } from "vitest"
import { mapOrderHeader, mapOrderHeaders } from "@/features/orders/mappers/OrderMapper"
import type { RawOrderHeader } from "@/features/orders/mappers/OrderMapper"

describe("mapOrderHeader()", () => {
  it("maps a complete raw row to OrderHeader", () => {
    const raw: RawOrderHeader = {
      id: 1,
      store_id: "store-1",
      no_pesanan: "ORD-001",
      status_pesanan: "Selesai",
      total_qty_valid: 5,
      total_omzet_valid: 450000,
      total_hpp_valid: 200000,
      status_order_final: "Selesai / Normal",
      income_aktual: 450000,
      status_income: "Sudah Cocok",
      profit_setelah_penyesuaian: 250000,
      status_profit: "Sudah Dihitung",
      status_hpp: "HPP Lengkap",
      item_count: 3,
    }
    const result = mapOrderHeader(raw)
    expect(result.id).toBe(1)
    expect(result.storeId).toBe("store-1")
    expect(result.totalQtyValid).toBe(5)
    expect(result.statusOrderFinal).toBe("Selesai / Normal")
    expect(result.incomeAktual).toBe(450000)
    expect(result.profitSetelahPenyesuaian).toBe(250000)
  })

  it("defaults missing fields to safe values", () => {
    const raw: RawOrderHeader = {}
    const result = mapOrderHeader(raw)
    expect(result.storeId).toBe("")
    expect(result.noPesanan).toBe("")
    expect(result.totalQtyValid).toBe(0)
    expect(result.statusOrderFinal).toBe("Selesai / Normal")
    expect(result.incomeAktual).toBeNull()
    expect(result.itemCount).toBe(0)
  })

  it("uses current timestamp when import_date is missing", () => {
    const raw: RawOrderHeader = {}
    const result = mapOrderHeader(raw)
    const resultDate = new Date(result.importDate).getTime()
    expect(resultDate).toBeGreaterThanOrEqual(new Date("2025-01-01").getTime())
    expect(resultDate).toBeLessThanOrEqual(new Date().getTime() + 1000)
  })
})

describe("mapOrderHeaders()", () => {
  it("maps an array of raw rows", () => {
    const raws: RawOrderHeader[] = [
      { id: 1, no_pesanan: "ORD-1" },
      { id: 2, no_pesanan: "ORD-2" },
    ]
    const results = mapOrderHeaders(raws)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe(1)
    expect(results[1].id).toBe(2)
  })
})
