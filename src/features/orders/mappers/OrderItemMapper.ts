/**
 * @module orders/mappers
 * OrderItemMapper — converts raw DB row / API response into OrderItem domain object.
 *
 * This is a pure function mapper. No database calls.
 */

import type { OrderItem } from "../types/OrderItem"

/**
 * Raw input shape (e.g. from Supabase row or API response).
 * Uses optional fields because DB rows may have nulls.
 */
export interface RawOrderItem {
  id?: number
  store_id?: string
  no_pesanan?: string
  status_pesanan?: string
  waktu_pesanan_dibuat?: string
  ekspedisi?: string | null
  kota?: string | null
  sku?: string
  sku_normalized?: string
  nama_produk?: string
  nama_variasi?: string
  harga_awal?: number
  harga_setelah_diskon?: number
  qty_order?: number
  qty_return?: number
  qty_valid?: number
  nilai_item_total?: number
  harga_per_qty?: number
  omzet_valid?: number
  omzet_retur?: number
  hpp_per_sku?: number | null
  hpp_valid?: number
  hpp_retur?: number
  status_item?: string
  item_hash?: string
  import_date?: string
}

export function mapOrderItem(raw: RawOrderItem): OrderItem {
  return {
    id: raw.id,
    storeId: raw.store_id ?? "",
    noPesanan: raw.no_pesanan ?? "",
    statusPesanan: raw.status_pesanan ?? "",
    waktuPesananDibuat: raw.waktu_pesanan_dibuat ?? "",
    ekspedisi: raw.ekspedisi ?? undefined,
    kota: raw.kota ?? undefined,
    sku: raw.sku ?? "",
    skuNormalized: raw.sku_normalized ?? raw.sku?.toLowerCase().trim() ?? "",
    namaProduk: raw.nama_produk ?? "",
    namaVariasi: raw.nama_variasi ?? "",
    hargaAwal: raw.harga_awal ?? 0,
    hargaSetelahDiskon: raw.harga_setelah_diskon ?? 0,
    qtyOrder: raw.qty_order ?? 0,
    qtyReturn: raw.qty_return ?? 0,
    qtyValid: raw.qty_valid ?? 0,
    nilaiItemTotal: raw.nilai_item_total ?? 0,
    hargaPerQty: raw.harga_per_qty ?? 0,
    omzetValid: raw.omzet_valid ?? 0,
    omzetRetur: raw.omzet_retur ?? 0,
    hppPerSku: raw.hpp_per_sku ?? null,
    hppValid: raw.hpp_valid ?? 0,
    hppRetur: raw.hpp_retur ?? 0,
    statusItem: (raw.status_item as OrderItem["statusItem"]) ?? "NORMAL",
    itemHash: raw.item_hash ?? "",
    importDate: raw.import_date ?? new Date().toISOString(),
  }
}

export function mapOrderItems(raws: RawOrderItem[]): OrderItem[] {
  return raws.map(mapOrderItem)
}
