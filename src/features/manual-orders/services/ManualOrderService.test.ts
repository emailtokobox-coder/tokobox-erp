import { describe, it, expect } from "vitest"
import { manualOrderService } from "@/features/manual-orders/services"

// ─── Helpers ───

function makeItem(overrides: Partial<{ qty: number; hargaSatuan: number; namaProduk: string }> = {}) {
  return {
    id: "",
    namaProduk: overrides.namaProduk ?? "Lemari Kayu",
    qty: overrides.qty ?? 2,
    hargaSatuan: overrides.hargaSatuan ?? 500000,
    beratGram: 0,
    subtotal: (overrides.qty ?? 2) * (overrides.hargaSatuan ?? 500000),
  }
}

// ─── Tests ───

describe("ManualOrderService", () => {
  // ─── calculateOrderTotal() ───

  describe("calculateOrderTotal()", () => {
    it("hitung total dasar dari subtotal - diskon + pajak + ongkir", () => {
      const items = [makeItem()]
      const result = manualOrderService.calculateOrderTotal(items, 0, 0, 0)
      expect(result.subtotal).toBe(1000000)
      expect(result.diskonNominal).toBe(0)
      expect(result.pajak).toBe(0)
      expect(result.ongkir).toBe(0)
      expect(result.total).toBe(1000000)
    })

    it("terapkan diskon persentase", () => {
      const items = [makeItem()]
      // subtotal = 2 * 500000 = 1,000,000; diskon 10% = 100,000
      const result = manualOrderService.calculateOrderTotal(items, 10, 0, 0)
      expect(result.subtotal).toBe(1000000)
      expect(result.diskonNominal).toBe(100000)
      expect(result.total).toBe(900000)
    })

      it("tambahkan pajak dan ongkir", () => {
        const items = [makeItem()]
        const result = manualOrderService.calculateOrderTotal(items, 0, 50000, 30000)
        expect(result.subtotal).toBe(1000000)
        expect(result.pajak).toBe(50000)
        expect(result.ongkir).toBe(30000)
        expect(result.total).toBe(1080000)
      })

    it("total tidak boleh negatif (clamp ke 0)", () => {
      const items = [makeItem({ hargaSatuan: 10000 })]
      // subtotal = 20,000; diskon 100% + pajak 0 + ongkir 0 = 0 (clamped)
      const result = manualOrderService.calculateOrderTotal(items, 100, 0, -100000)
      expect(result.total).toBe(0)
      expect(result.ongkir).toBe(0) // negative ongkir clamped to 0
    })

    it("batas diskon maksimal 100% (bukan lebih tinggi)", () => {
      const items = [makeItem()]
      const result = manualOrderService.calculateOrderTotal(items, 150, 0, 0)
      // Clamped at 100% → full subtotal
      expect(result.diskonNominal).toBe(1000000)
      expect(result.total).toBe(0)
    })

    it("multi-item menghitung semua item", () => {
      const items = [
        makeItem({ qty: 2, hargaSatuan: 100000 }),
        makeItem({ qty: 1, hargaSatuan: 250000 }),
      ]
      const result = manualOrderService.calculateOrderTotal(items, 10, 10000, 0)
      expect(result.subtotal).toBe(450000)
      expect(result.diskonNominal).toBe(45000)
      expect(result.total).toBe(415000)
    })

    it("default parameter diskon/pajak/ongkir = 0", () => {
      const items = [makeItem()]
      const result = manualOrderService.calculateOrderTotal(items)
      expect(result.total).toBe(1000000)
    })
  })

  // ─── validateOrder() ───

  describe("validateOrder()", () => {
    it("valid: semua field isi dengan benar", () => {
      const data = {
        namaPelanggan: "Budi Santoso",
        noHp: "08123456789",
        items: [makeItem()],
        tipePesanan: "MANUAL_CASH" as const,
        totalBayar: 1000000,
        total: 1000000,
      }
      const result = manualOrderService.validateOrder(data)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("invalid: namaPelanggan kosong", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "",
        noHp: "08123456789",
        items: [makeItem()],
        tipePesanan: "MANUAL_CASH" as const,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("Nama pelanggan"))).toBe(true)
    })

    it("invalid: noHp kurang dari 8 digit", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "12345",
        items: [makeItem()],
        tipePesanan: "MANUAL_CASH" as const,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("Nomor HP"))).toBe(true)
    })

    it("invalid: items kosong", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [],
        tipePesanan: "MANUAL_CASH" as const,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("minimal 1 item"))).toBe(true)
    })

    it("invalid: item qty = 0", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [makeItem({ qty: 0 })],
        tipePesanan: "MANUAL_CASH" as const,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("qty"))).toBe(true)
    })

    it("invalid: item harga = 0", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [makeItem({ hargaSatuan: 0 })],
        tipePesanan: "MANUAL_CASH" as const,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("harga satuan"))).toBe(true)
    })

    it("invalid: termin persentase total bukan 100%", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [makeItem()],
        tipePesanan: "MANUAL_TERMIN",
        terminSchedule: [
          { persentase: 40, nominal: 400000 },
          { persentase: 30, nominal: 300000 },
          // total = 70%, bukan 100%
        ],
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("100%"))).toBe(true)
    })

    it("valid: termin persentase total = 100%", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [makeItem()],
        tipePesanan: "MANUAL_TERMIN",
        terminSchedule: [
          { persentase: 40, nominal: 400000 },
          { persentase: 30, nominal: 300000 },
          { persentase: 30, nominal: 300000 },
        ],
      })
      // totalBayar not specified, so skip the totalBayar <= total check
      expect(result.errors.filter((e) => e.includes("100%")).length).toBe(0)
    })

    it("invalid: totalBayar melebihi totalHarga (DP/Termin)", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "Budi",
        noHp: "08123456789",
        items: [makeItem()],
        tipePesanan: "MANUAL_DP",
        totalBayar: 2000000,
        total: 1000000,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("melebihi total harga"))).toBe(true)
    })

    it("multiple errors dikumpulkan semuanya", () => {
      const result = manualOrderService.validateOrder({
        namaPelanggan: "",
        noHp: "123",
        items: [],
        tipePesanan: "MANUAL_CASH",
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ─── buildOrderNumber() ───

  describe("buildOrderNumber()", () => {
    it("generate MO-YYYYMMDD-001 jika belum ada number", () => {
      const result = manualOrderService.buildOrderNumber("store-1", "2026-07-26")
      expect(result).toBe("MO-20260726-001")
    })

    it("generate sequence yang terus naik", () => {
      const existing = ["MO-20260726-001", "MO-20260726-002", "MO-20260726-003"]
      const result = manualOrderService.buildOrderNumber("store-1", "2026-07-26", existing)
      expect(result).toBe("MO-20260726-004")
    })

    it("format dengan leading zeros (3 digit)", () => {
      const existing = ["MO-20260726-009"]
      const result = manualOrderService.buildOrderNumber("store-1", "2026-07-26", existing)
      expect(result).toBe("MO-20260726-010")
    })

    it("bukan duplicate dengan tanggal berbeda", () => {
      const existing = ["MO-20260725-001"]
      const result = manualOrderService.buildOrderNumber("store-1", "2026-07-26", existing)
      // Different date, so starts at 001
      expect(result).toBe("MO-20260726-001")
    })
  })

  // ─── recalculateSisaPembayaran() ───

  describe("recalculateSisaPembayaran()", () => {
    it("sisa pembayaran = total - dp - termin", () => {
      const schedule = [
        { persentase: 30, nominal: 300000 },
        { persentase: 30, nominal: 300000 },
      ]
      const result = manualOrderService.recalculateSisaPembayaran(schedule, 200000, 1000000)
      // dpBaru=200,000, termin total=600,000; reserved=800,000; sisa=200,000
      expect(result).toBe(200000)
    })

    it("tanpa schedule dan tanpa dp", () => {
      const result = manualOrderService.recalculateSisaPembayaran([], 0, 500000)
      expect(result).toBe(500000)
    })

    it("total harga 0 maka sisa = 0", () => {
      const result = manualOrderService.recalculateSisaPembayaran([], 0, 0)
      expect(result).toBe(0)
    })

    it("clamp: tidak boleh negatif meskipun overpaid", () => {
      const schedule = [
        { persentase: 60, nominal: 600000 },
        { persentase: 50, nominal: 500000 },
      ]
      // reserved 1,100,000 > total 1,000,000 → clamped to 0
      const result = manualOrderService.recalculateSisaPembayaran(schedule, 0, 1000000)
      expect(result).toBe(0)
    })

    it("tanpa dpBaru (hanya termin)", () => {
      const schedule = [
        { persentase: 50, nominal: 500000 },
      ]
      const result = manualOrderService.recalculateSisaPembayaran(schedule, undefined, 1000000)
      expect(result).toBe(500000)
    })
  })
})
