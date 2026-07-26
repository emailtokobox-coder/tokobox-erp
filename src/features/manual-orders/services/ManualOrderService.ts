/**
 * @module manual-orders/services
 * Manual Order Service — business logic layer for manual order calculations and validation.
 *
 * Separates business logic from Supabase queries.
 *
 * Architecture:
 * components → actions → services → repositories → Supabase
 *
 * Usage:
 * import { calculateOrderTotal, validateOrder, buildOrderNumber } from "@/features/manual-orders/services"
 */

import type {
  ManualOrderItem,
} from "../types/ManualOrder"

// ─── Result Types ───

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface OrderCalculation {
  subtotal: number
  diskonNominal: number
  pajak: number
  ongkir: number
  total: number
}

export interface OrderBuildResult {
  noManualOrder: string
  calculation: OrderCalculation
}

export interface TerminScheduleEntry {
  persentase: number
  nominal: number
  tanggalJatuhTempo?: string
}

// ─── Manual Order Service ───

export const manualOrderService = {
  /**
   * Calculate the total order amount.
   *
   * Formula: subtotal - diskonNominal + pajak + ongkir
   * Validates that total is never negative.
   *
   * @param items - Array of order items with qty and hargaSatuan
   * @param diskon - Discount percentage (0-100)
   * @param pajak - Tax amount in Rupiah
   * @param ongkir - Shipping cost in Rupiah
   * @returns OrderCalculation with breakdown
   */
  calculateOrderTotal(
    items: ManualOrderItem[],
    diskon: number = 0,
    pajak: number = 0,
    ongkir: number = 0,
  ): OrderCalculation {
    // Calculate subtotal: SUM(qty × hargaSatuan)
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.qty || 0) * (item.hargaSatuan || 0)
    }, 0)

    // Calculate diskon nominal from percentage
    const diskonNominal = Math.round(subtotal * Math.min(Math.max(diskon, 0), 100) / 100)

    // Total formula with floor at 0 (no negative totals)
    const total = Math.max(subtotal - diskonNominal + Math.max(pajak, 0) + Math.max(ongkir, 0), 0)

    return {
      subtotal,
      diskonNominal,
      pajak: Math.max(pajak, 0),
      ongkir: Math.max(ongkir, 0),
      total,
    }
  },

  /**
   * Validate order data before creation/update.
   *
   * Rules:
   * - namaPelanggan: required, min 2 characters
   * - noHp: required, minimum 8 digits
   * - items: required, at least 1, each item has qty > 0 and harga > 0
   * - dpPersentase/termin: sum of all percentages must equal exactly 100%
   * - totalBayar <= totalHarga (for DP/Termin)
   *
   * @param data - Partial order data to validate
   * @returns ValidationResult with valid flag and error messages
   */
  validateOrder(data: {
    namaPelanggan?: string
    noHp?: string
    items?: ManualOrderItem[]
    tipePesanan?: string
    dpPersentase?: number
    terminSchedule?: TerminScheduleEntry[]
    totalBayar?: number
    total?: number
  }): ValidationResult {
    const errors: string[] = []

    // namaPelanggan tidak boleh kosong
    if (!data.namaPelanggan || data.namaPelanggan.trim().length < 2) {
      errors.push("Nama pelanggan harus diisi (minimal 2 karakter)")
    }

    // noHp minimal 8 digit
    const phoneDigits = (data.noHp || "").replace(/\D/g, "")
    if (phoneDigits.length < 8) {
      errors.push("Nomor HP harus minimal 8 digit angka")
    }

    // items tidak boleh kosong
    if (!data.items || data.items.length === 0) {
      errors.push("Pesanan harus memiliki minimal 1 item")
    } else {
      // Validasi setiap item
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        if (!item.namaProduk || item.namaProduk.trim().length === 0) {
          errors.push(`Item #${i + 1}: nama produk harus diisi`)
        }
        if ((item.qty || 0) <= 0) {
          errors.push(`Item #${i + 1}: qty harus lebih besar dari 0`)
        }
        if ((item.hargaSatuan || 0) <= 0) {
          errors.push(`Item #${i + 1}: harga satuan harus lebih besar dari 0`)
        }
      }
    }

    // dpPersentase / termin: total persentase harus = 100%
    if (data.tipePesanan === "MANUAL_DP" && data.dpPersentase !== undefined) {
      if (data.dpPersentase <= 0 || data.dpPersentase > 100) {
        errors.push("Persentase DP harus antara 1-100%")
      }
    }

    if (data.tipePesanan === "MANUAL_TERMIN" && data.terminSchedule && data.terminSchedule.length > 0) {
      const totalPersentase = data.terminSchedule.reduce(
        (sum, row) => sum + (row.persentase || 0),
        0,
      )
      if (totalPersentase !== 100) {
        errors.push(
          `Total persentase termin harus 100% (saat ini: ${totalPersentase}%)`,
        )
      }
    }

    // totalBayar <= totalHarga untuk DP/Termin
    if (
      (data.tipePesanan === "MANUAL_DP" || data.tipePesanan === "MANUAL_TERMIN") &&
      data.totalBayar !== undefined &&
      data.total !== undefined &&
      data.total > 0
    ) {
      if (data.totalBayar > data.total) {
        errors.push("Total bayar tidak boleh melebihi total harga")
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * Build order number in format MO-YYYYMMDD-NNN.
   *
   * Checks existing no_manual_order in the database to avoid duplicates.
   *
   * @param storeId - Store identifier
   * @param tanggal - Date string in YYYY-MM-DD format
   * @param existingNumbers - Array of existing order numbers for the same date
   * @returns New unique order number
   */
  buildOrderNumber(
    _storeId: string,
    tanggal: string,
    existingNumbers: string[] = [],
  ): string {
    const datePart = tanggal.replace(/-/g, "")
    const prefix = `MO-${datePart}`

    // Filter existing numbers for the same date prefix
    const matchingNumbers = existingNumbers.filter((n) => n.startsWith(prefix + "-"))

    // Find the next sequence number
    let maxSeq = 0
    for (const num of matchingNumbers) {
      const parts = num.split("-")
      const seq = parseInt(parts[parts.length - 1] || "0", 10)
      if (seq > maxSeq) maxSeq = seq
    }

    const nextSeq = maxSeq + 1
    return `${prefix}-${String(nextSeq).padStart(3, "0")}`
  },

  /**
   * Recalculate remaining payment (sisa pembayaran) from the payment schedule.
   *
   * Used when updating DP or Termin payments.
   *
   * @param terminSchedule - Array of termin payment entries
   * @param dpBaru - New DP amount (optional, for DP orders)
   * @param totalHarga - Total order amount
   * @returns Remaining payment amount
   */
  recalculateSisaPembayaran(
    terminSchedule: TerminScheduleEntry[],
    dpBaru?: number,
    totalHarga: number = 0,
  ): number {
    const totalTermin = terminSchedule.reduce(
      (sum, entry) => sum + (entry.nominal || 0),
      0,
    )

    const totalReserved = (dpBaru || 0) + totalTermin

    return Math.max(totalHarga - totalReserved, 0)
  },
}
