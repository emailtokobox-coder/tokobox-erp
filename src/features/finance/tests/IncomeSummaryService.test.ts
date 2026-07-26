import { describe, it, expect } from "vitest"
import { IncomeSummaryService } from "@/features/finance/services/IncomeSummaryService"
import type { OrderHeader, IncomeRecord } from "@/features/orders/types/OrderItem"

// ─── Helpers ───

function makeOrderHeader(overrides: Partial<OrderHeader> = {}): OrderHeader {
  return {
    id: 1,
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
    storeId: "store-1",
    ...overrides,
  }
}

function makeIncomeRecord(overrides: Partial<IncomeRecord> = {}): IncomeRecord {
  return {
    id: 1,
    storeId: "store-1",
    noPesanan: overrides.noPesanan ?? "ORD-001",
    usernamePembeli: overrides.usernamePembeli ?? "Budi",
    waktuPesananDibuat: "2026-07-26T10:00:00Z",
    metodePembayaran: overrides.metodePembayaran ?? "Transfer Bank",
    tanggalDanaDilepaskan: overrides.tanggalDanaDilepaskan ?? "2026-07-27",
    hargaAsliProduk: 500000,
    totalDiskonProduk: 0,
    pengembalianDana: 0,
    diskonDariShopee: 5000,
    voucherPenjual: 0,
    ongkirDibayarPembeli: 10000,
    gratisOngkirShopee: 0,
    biayaKomisiAms: 12500,
    biayaAdministrasi: 2000,
    biayaLayanan: 1000,
    biayaProsesPesanan: 2500,
    totalPenghasilan: overrides.totalPenghasilan ?? 350000,
    importDate: "2026-07-27",
    ...overrides,
  }
}

// ─── Tests ───

describe("IncomeSummaryService.matchIncomeToOrders()", () => {
  it("cocokkan income ke order yang sesuai (by noPesanan)", () => {
    const headers = [makeOrderHeader({ noPesanan: "ORD-001" })]
    const incomes = [makeIncomeRecord({ noPesanan: "ORD-001", totalPenghasilan: 350000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.headers[0].incomeAktual).toBe(350000)
    expect(result.headers[0].statusIncome).toBe("Sudah Cocok")
    expect(result.headers[0].statusProfit).toBe("Sudah Dihitung")
    expect(result.matchedCount).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it("hitung profit_sebelum_penyesuaian = income - totalHppValid", () => {
    const headers = [makeOrderHeader({ totalHppValid: 200000 })]
    const incomes = [makeIncomeRecord({ totalPenghasilan: 350000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.headers[0].profitSebelumPenyesuaian).toBe(150000)
    expect(result.headers[0].profitSetelahPenyesuaian).toBe(150000)
  })

  it("hitung profit_setelah_penyesuaian including existing adjustment", () => {
    const headers = [makeOrderHeader({ totalHppValid: 200000, totalPenyesuaian: 50000 })]
    const incomes = [makeIncomeRecord({ totalPenghasilan: 350000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.headers[0].profitSebelumPenyesuaian).toBe(150000)
    expect(result.headers[0].profitSetelahPenyesuaian).toBe(200000)
  })

  it("skip order yang sudah 'Sudah Cocok' (idempotent)", () => {
    const headers = [
      makeOrderHeader({
        statusIncome: "Sudah Cocok",
        incomeAktual: 350000,
        profitSebelumPenyesuaian: 150000,
      }),
    ]
    const incomes = [makeIncomeRecord({ totalPenghasilan: 350000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    // Should keep existing values (idempotent)
    expect(result.headers[0].incomeAktual).toBe(350000)
    expect(result.headers[0].profitSebelumPenyesuaian).toBe(150000)
  })

  it("skip order 'Batal' saat estimasi", () => {
    const headers = [makeOrderHeader({ statusOrderFinal: "Batal", totalOmzetValid: 500000 })]
    const incomes: IncomeRecord[] = []

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.estimatedCount).toBe(0)
    expect(result.headers[0].statusIncome).toBe("Belum Ada Income")
  })

  it("skip jika noPesanan tidak cocok — income diestimasi", () => {
    const headers = [makeOrderHeader({ noPesanan: "ORD-999", totalOmzetValid: 400000 })]
    const incomes = [makeIncomeRecord({ noPesanan: "ORD-001", totalPenghasilan: 350000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    // Tidak ada income yang cocok → diestimasikan
    expect(result.headers[0].statusIncome).toBe("Belum Ada Income / Estimasi")
    expect(result.headers[0].incomeAktual).toBe(300000) // 400000 - 25%
  })

  it("estimasi income: totalOmzetValid - fee 25%", () => {
    const headers = [makeOrderHeader({ totalOmzetValid: 400000 })]
    const incomes: IncomeRecord[] = []

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    // estimasi = 400,000 - (400,000 * 0.25) = 300,000
    expect(result.estimatedCount).toBe(1)
    expect(result.headers[0].statusIncome).toBe("Belum Ada Income / Estimasi")
    expect(result.headers[0].incomeAktual).toBe(300000)
  })

  it("estimasi = 0 untuk order dengan omzet 0", () => {
    const headers = [makeOrderHeader({ totalOmzetValid: 0 })]
    const incomes: IncomeRecord[] = []

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.estimatedCount).toBe(0)
    expect(result.headers[0].incomeAktual).toBeNull()
  })

  it("estimasi fee marketplace custom rate", () => {
    const headers = [makeOrderHeader({ totalOmzetValid: 500000 })]
    const incomes: IncomeRecord[] = []

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 20)

    // estimasi = 500,000 - (500,000 * 0.20) = 400,000
    expect(result.estimatedCount).toBe(1)
    expect(result.headers[0].incomeAktual).toBe(400000)
  })

  it("masukkan lebih dari satu order, sebagian dicocokkan", () => {
    const headers = [
      makeOrderHeader({ noPesanan: "ORD-001", totalOmzetValid: 0 }),
      makeOrderHeader({ noPesanan: "ORD-002" }),
      makeOrderHeader({ noPesanan: "ORD-003", totalOmzetValid: 0 }),
    ]
    const incomes = [makeIncomeRecord({ noPesanan: "ORD-002", totalPenghasilan: 300000 })]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    // ORD-001 & ORD-003: no income & omzet=0 → tidak diestimasikan
    expect(result.headers[0].statusIncome).toBe("Belum Ada Income")
    expect(result.headers[1].statusIncome).toBe("Sudah Cocok")
    expect(result.headers[1].incomeAktual).toBe(300000)
    expect(result.headers[2].statusIncome).toBe("Belum Ada Income")
    expect(result.estimatedCount).toBe(0)
  })

  it("update waktuPembayaran dan metodePembayaran dari income", () => {
    const headers = [
      makeOrderHeader({
        noPesanan: "ORD-001",
        waktuPembayaran: "",
        metodePembayaran: "",
      }),
    ]
    const incomes = [
      makeIncomeRecord({
        noPesanan: "ORD-001",
        tanggalDanaDilepaskan: "2026-07-28",
        metodePembayaran: "ShopeePay",
      }),
    ]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.headers[0].waktuPembayaran).toBe("2026-07-28")
    expect(result.headers[0].metodePembayaran).toBe("ShopeePay")
  })

  it("tidak overwrite waktuPembayaran yang sudah ada", () => {
    const headers = [
      makeOrderHeader({
        noPesanan: "ORD-001",
        waktuPembayaran: "2026-07-25",
      }),
    ]
    const incomes = [
      makeIncomeRecord({
        noPesanan: "ORD-001",
        tanggalDanaDilepaskan: "2026-07-28",
      }),
    ]

    const result = IncomeSummaryService.matchIncomeToOrders(headers, incomes, 25)

    expect(result.headers[0].waktuPembayaran).toBe("2026-07-25")
  })
})

// ─── calculateEstimatedIncome() ───

describe("IncomeSummaryService.calculateEstimatedIncome()", () => {
  it("estimasi dasar: omzet - fee 25%", () => {
    const order = makeOrderHeader({ totalOmzetValid: 400000 })
    const result = IncomeSummaryService.calculateEstimatedIncome(order, 25)
    expect(result).toBe(300000)
  })

  it("return 0 untuk order batal", () => {
    const order = makeOrderHeader({ statusOrderFinal: "Batal", totalOmzetValid: 400000 })
    const result = IncomeSummaryService.calculateEstimatedIncome(order, 25)
    expect(result).toBe(0)
  })

  it("return 0 untuk omzet 0", () => {
    const order = makeOrderHeader({ totalOmzetValid: 0 })
    const result = IncomeSummaryService.calculateEstimatedIncome(order, 25)
    expect(result).toBe(0)
  })

  it("default rate 25%", () => {
    const order = makeOrderHeader({ totalOmzetValid: 400000 })
    const result = IncomeSummaryService.calculateEstimatedIncome(order)
    expect(result).toBe(300000)
  })

  it("fee 10% menghasilkan estimasi lebih tinggi", () => {
    const order = makeOrderHeader({ totalOmzetValid: 400000 })
    const result10 = IncomeSummaryService.calculateEstimatedIncome(order, 10)
    const result25 = IncomeSummaryService.calculateEstimatedIncome(order, 25)
    expect(result10).toBeGreaterThan(result25)
    expect(result10).toBe(360000)
  })

  it("fee maybe di atas 100% tidak membuat estimasi negatif", () => {
    const order = makeOrderHeader({ totalOmzetValid: 100000 })
    const result = IncomeSummaryService.calculateEstimatedIncome(order, 150)
    expect(result).toBe(0) // clamped to 0, not negative
  })
})
