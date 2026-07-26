import { describe, it, expect } from "vitest"
import { ProfitRecalculationService } from "@/features/finance/services/ProfitRecalculationService"
import type { OrderHeader, AdjustmentRecord } from "@/features/orders/types/OrderItem"

// ─── Helpers ───

function makeOrderHeader(overrides: Partial<OrderHeader> = {}): OrderHeader {
  return {
    id: 1,
    storeId: "store-1",
    noPesanan: overrides.noPesanan ?? "ORD-001",
    statusPesanan: "Selesai",
    waktuPesananDibuat: "2026-07-26T10:00:00Z",
    waktuPembayaran: "",
    metodePembayaran: "",
    usernamePembeli: "",
    ekspedisi: "JNE",
    kota: "Jakarta",
    totalQtyOrder: 2,
    totalQtyReturn: 0,
    totalQtyValid: 2,
    totalOmzetValid: overrides.totalOmzetValid ?? 500000,
    totalOmzetRetur: 0,
    totalHppValid: overrides.totalHppValid ?? 200000,
    totalHppRetur: 0,
    statusOrderFinal: overrides.statusOrderFinal ?? "Selesai / Normal",
    incomeAktual: overrides.incomeAktual ?? null,
    statusIncome: overrides.statusIncome ?? "Belum Ada Income",
    totalPenyesuaian: overrides.totalPenyesuaian ?? 0,
    profitSebelumPenyesuaian: overrides.profitSebelumPenyesuaian ?? 0,
    profitSetelahPenyesuaian: overrides.profitSetelahPenyesuaian ?? 0,
    statusProfit: overrides.statusProfit ?? "Belum Ada Income",
    statusHpp: overrides.statusHpp ?? "HPP Lengkap",
    itemCount: 2,
    importDate: "2026-07-26",
    ...overrides,
  }
}

function makeAdjustment(overrides: Partial<AdjustmentRecord> = {}): AdjustmentRecord {
  return {
    id: 1,
    storeId: "store-1",
    noPesananTerhubung: overrides.noPesananTerhubung ?? "ORD-001",
    tanggalAdjustment: "2026-07-27",
    tipeAdjustment: overrides.tipeAdjustment ?? "Biaya Retur",
    biayaPenyesuaian: overrides.biayaPenyesuaian ?? 50000,
    importDate: "2026-07-27",
    ...overrides,
  }
}

// ─── Tests ───

describe("ProfitRecalculationService.recalculateProfit()", () => {
  it("hitung profit dasar: income - hppValid", () => {
    const order = makeOrderHeader({ incomeAktual: 350000, totalHppValid: 200000 })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.profitSebelumPenyesuaian).toBe(150000)
    expect(result.profitSetelahPenyesuaian).toBe(150000)
    expect(result.statusProfit).toBe("Sudah Dihitung")
    expect(result.recalculated).toBe(true)
  })

  it("hitung profit dengan adjustment: income + adj - hppValid", () => {
    const order = makeOrderHeader({ incomeAktual: 350000, totalHppValid: 200000 })
    const result = ProfitRecalculationService.recalculateProfit(order, 50000)

    expect(result.profitSebelumPenyesuaian).toBe(150000)
    expect(result.profitSetelahPenyesuaian).toBe(200000)
  })

  it("order batal: profit = 0, status = Tidak Dihitung", () => {
    const order = makeOrderHeader({ statusOrderFinal: "Batal" })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.profitSebelumPenyesuaian).toBe(0)
    expect(result.profitSetelahPenyesuaian).toBe(0)
    expect(result.statusProfit).toBe("Tidak Dihitung")
    expect(result.recalculated).toBe(false)
  })

  it("order tanpa income: status = Belum Ada Income", () => {
    const order = makeOrderHeader({ incomeAktual: null })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.statusProfit).toBe("Belum Ada Income")
    expect(result.recalculated).toBe(false)
  })

  it("hitung profit margin: (profit / omzet) * 100", () => {
    const order = makeOrderHeader({ incomeAktual: 500000, totalHppValid: 200000, totalOmzetValid: 500000 })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    // profit = 300,000; margin = (300000 / 500000) * 100 = 60%
    expect(result.profitMargin).toBeCloseTo(60, 2)
  })

  it("margin = 0 jika omzet = 0", () => {
    const order = makeOrderHeader({ incomeAktual: 350000, totalHppValid: 200000, totalOmzetValid: 0 })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.profitMargin).toBe(0)
  })

  it("idempotent: skip jika nilai sudah sama", () => {
    const order = makeOrderHeader({
      incomeAktual: 350000,
      totalHppValid: 200000,
      totalPenyesuaian: 0,
      profitSebelumPenyesuaian: 150000,
      profitSetelahPenyesuaian: 150000,
      statusProfit: "Sudah Dihitung",
    })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.wasIdempotent).toBe(true)
    expect(result.recalculated).toBe(false)
  })

  it("idempotent: recalculate jika adjustment berubah", () => {
    const order = makeOrderHeader({
      incomeAktual: 350000,
      totalHppValid: 200000,
      totalPenyesuaian: 0,
      profitSebelumPenyesuaian: 150000,
      profitSetelahPenyesuaian: 150000,
      statusProfit: "Sudah Dihitung",
    })
    const result = ProfitRecalculationService.recalculateProfit(order, 50000)

    expect(result.wasIdempotent).toBe(false)
    expect(result.recalculated).toBe(true)
    expect(result.profitSetelahPenyesuaian).toBe(200000)
  })

  it("profit negatif tetap dihitung (bukan diabaikan)", () => {
    const order = makeOrderHeader({ incomeAktual: 100000, totalHppValid: 200000 })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.profitSebelumPenyesuaian).toBe(-100000)
    expect(result.statusProfit).toBe("Sudah Dihitung")
  })

  it("incomeAktual null diperlakukan sebagai 0", () => {
    const order = makeOrderHeader({ incomeAktual: null })
    const result = ProfitRecalculationService.recalculateProfit(order, 0)

    expect(result.statusProfit).toBe("Belum Ada Income")
  })
})

// ─── recalculateAll() ───

describe("ProfitRecalculationService.recalculateAll()", () => {
  it("recalculate semua order non-batal", () => {
    const headers = [
      makeOrderHeader({ noPesanan: "ORD-001", incomeAktual: 350000 }),
      makeOrderHeader({ noPesanan: "ORD-002", incomeAktual: 500000 }),
    ]
    const adjustments: AdjustmentRecord[] = []

    const result = ProfitRecalculationService.recalculateAll(headers, adjustments)

    expect(result.recalculatedCount).toBe(2)
    expect(result.batalCount).toBe(0)
  })

  it("skip order batal", () => {
    const headers = [
      makeOrderHeader({ noPesanan: "ORD-001", incomeAktual: 350000, totalHppValid: 200000 }),
      makeOrderHeader({ noPesanan: "ORD-002", statusOrderFinal: "Batal" }),
    ]

    const result = ProfitRecalculationService.recalculateAll(headers)

    expect(result.recalculatedCount).toBe(1)
    expect(result.batalCount).toBe(1)
  })

  it("idempotent: skip yang sudah dihitung sama", () => {
    const headers = [
      makeOrderHeader({
        noPesanan: "ORD-001",
        incomeAktual: 350000,
        totalHppValid: 200000,
        totalPenyesuaian: 0,
        profitSebelumPenyesuaian: 150000,
        profitSetelahPenyesuaian: 150000,
        statusProfit: "Sudah Dihitung",
      }),
      makeOrderHeader({ noPesanan: "ORD-002", incomeAktual: 400000 }),
    ]

    const result = ProfitRecalculationService.recalculateAll(headers)

    expect(result.recalculatedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
  })

  it("aggregate adjustment dari multiple records per order", () => {
    const headers = [makeOrderHeader({ noPesanan: "ORD-001", incomeAktual: 350000, totalHppValid: 200000 })]
    const adjustments = [
      makeAdjustment({ noPesananTerhubung: "ORD-001", biayaPenyesuaian: 30000 }),
      makeAdjustment({ noPesananTerhubung: "ORD-001", biayaPenyesuaian: 20000 }),
    ]

    const result = ProfitRecalculationService.recalculateAll(headers, adjustments)

    expect(result.recalculatedCount).toBe(1)
    // Verify calculation by calling recalculateProfit directly
    const order = headers[0]
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.biayaPenyesuaian, 0)
    const expectedProfitAfter = order.incomeAktual! + totalAdjustment - order.totalHppValid
    const calcResult = ProfitRecalculationService.recalculateProfit(order, totalAdjustment)
    expect(calcResult.profitSetelahPenyesuaian).toBe(expectedProfitAfter)
  })

  it("return errors array kosong jika tidak ada error", () => {
    const headers = [makeOrderHeader({ incomeAktual: 350000 })]
    const result = ProfitRecalculationService.recalculateAll(headers)

    expect(result.errors).toHaveLength(0)
  })
})

// ─── buildUpdatePayload() ───

describe("ProfitRecalculationService.buildUpdatePayload()", () => {
  it("build payload untuk order yang perlu update", () => {
    const headers = [
      makeOrderHeader({ noPesanan: "ORD-001", incomeAktual: 350000, totalHppValid: 200000 }),
    ]
    const adjustments = [makeAdjustment({ noPesananTerhubung: "ORD-001", biayaPenyesuaian: 50000 })]

    const payload = ProfitRecalculationService.buildUpdatePayload(headers, adjustments)

    expect(payload.size).toBe(1)
    expect(payload.has("ORD-001")).toBe(true)
  })

  it("skip order batal", () => {
    const headers = [makeOrderHeader({ statusOrderFinal: "Batal" })]
    const payload = ProfitRecalculationService.buildUpdatePayload(headers)

    expect(payload.size).toBe(0)
  })

  it("skip order tanpa income (kecuali Tidak Perlu Income)", () => {
    const headers = [makeOrderHeader({ incomeAktual: null })]
    const payload = ProfitRecalculationService.buildUpdatePayload(headers)

    expect(payload.size).toBe(0)
  })

  it("idempotent: skip jika nilai tidak berubah", () => {
    const headers = [
      makeOrderHeader({
        noPesanan: "ORD-001",
        incomeAktual: 350000,
        totalHppValid: 200000,
        totalPenyesuaian: 0,
        profitSebelumPenyesuaian: 150000,
        profitSetelahPenyesuaian: 150000,
        statusProfit: "Sudah Dihitung",
      }),
    ]
    const payload = ProfitRecalculationService.buildUpdatePayload(headers)

    expect(payload.size).toBe(0)
  })

  it("tidak ada adjustment = total 0", () => {
    const headers = [makeOrderHeader({ noPesanan: "ORD-001", incomeAktual: 350000, totalHppValid: 200000 })]
    const payload = ProfitRecalculationService.buildUpdatePayload(headers, [])

    expect(payload.size).toBe(1)
    const updateData = payload.get("ORD-001")
    expect(updateData?.totalPenyesuaian).toBe(0)
  })
})
