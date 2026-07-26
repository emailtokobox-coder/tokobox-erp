/**
 * @module orders/mappers
 * OrderMapper — converts raw DB row / API response into OrderHeader domain object.
 *
 * This is a pure function mapper. No database calls.
 */

import type { OrderHeader } from "../types/OrderItem"

/**
 * Raw input shape (e.g. from Supabase row or API response).
 */
export interface RawOrderHeader {
  id?: number
  store_id?: string
  no_pesanan?: string
  status_pesanan?: string
  waktu_pesanan_dibuat?: string
  waktu_pembayaran?: string
  metode_pembayaran?: string
  username_pembeli?: string
  ekspedisi?: string | null
  kota?: string | null
  total_qty_order?: number
  total_qty_return?: number
  total_qty_valid?: number
  total_omzet_valid?: number
  total_omzet_retur?: number
  total_hpp_valid?: number
  total_hpp_retur?: number
  status_order_final?: string
  income_aktual?: number | null
  status_income?: string
  total_penyesuaian?: number
  profit_sebelum_penyesuaian?: number
  profit_setelah_penyesuaian?: number
  status_profit?: string
  status_hpp?: string
  item_count?: number
  import_date?: string
}

export function mapOrderHeader(raw: RawOrderHeader): OrderHeader {
  return {
    id: raw.id,
    storeId: raw.store_id ?? "",
    noPesanan: raw.no_pesanan ?? "",
    statusPesanan: raw.status_pesanan ?? "",
    waktuPesananDibuat: raw.waktu_pesanan_dibuat ?? "",
    waktuPembayaran: raw.waktu_pembayaran ?? "",
    metodePembayaran: raw.metode_pembayaran ?? "",
    usernamePembeli: raw.username_pembeli ?? "",
    ekspedisi: raw.ekspedisi ?? undefined,
    kota: raw.kota ?? undefined,
    totalQtyOrder: raw.total_qty_order ?? 0,
    totalQtyReturn: raw.total_qty_return ?? 0,
    totalQtyValid: raw.total_qty_valid ?? 0,
    totalOmzetValid: raw.total_omzet_valid ?? 0,
    totalOmzetRetur: raw.total_omzet_retur ?? 0,
    totalHppValid: raw.total_hpp_valid ?? 0,
    totalHppRetur: raw.total_hpp_retur ?? 0,
    statusOrderFinal: raw.status_order_final as OrderHeader["statusOrderFinal"] ?? "Selesai / Normal",
    incomeAktual: raw.income_aktual ?? null,
    statusIncome: raw.status_income as OrderHeader["statusIncome"] ?? "Belum Ada Income",
    totalPenyesuaian: raw.total_penyesuaian ?? 0,
    profitSebelumPenyesuaian: raw.profit_sebelum_penyesuaian ?? 0,
    profitSetelahPenyesuaian: raw.profit_setelah_penyesuaian ?? 0,
    statusProfit: raw.status_profit as OrderHeader["statusProfit"] ?? "Belum Ada Income",
    statusHpp: raw.status_hpp as OrderHeader["statusHpp"] ?? "HPP Kosong",
    itemCount: raw.item_count ?? 0,
    importDate: raw.import_date ?? new Date().toISOString(),
  }
}

export function mapOrderHeaders(raws: RawOrderHeader[]): OrderHeader[] {
  return raws.map(mapOrderHeader)
}
