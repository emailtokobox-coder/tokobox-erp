/**
 * @module orders/actions
 * Server Actions — bridge between UI components and OrderRepository.
 *
 * These connect to Supabase via OrderSupabaseRepository.
 *
 * Usage in components:
 *   const orders = await getOrdersAction({ search: "ORD-001", page: 1 })
 */

"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import type { OrderItem, OrderHeader, IncomeRecord, AdjustmentRecord } from "../types/OrderItem";
import type { OrderFilter } from "../types/OrderFilter"
import type { RawOrderItem } from "../mappers/OrderItemMapper"

// ─── Result Types ───

export interface OrderListResult {
  headers: OrderHeader[]
  total: number
  page: number
  pageSize: number
}

// ─── Server Action ───

/**
 * Fetch orders with optional filters.
 * Returns paginated list of order headers.
 */
export async function getOrdersAction(
  filter?: OrderFilter
): Promise<OrderListResult> {
  const client = createSupabaseClient()

  const page = filter?.page ?? 1
  const pageSize = filter?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from("orders")
    .select("*", { count: "exact" })
    .order("waktu_pesanan_dibuat", { ascending: false })
    .range(from, to)

  if (filter?.noPesanan) {
    query = query.eq("no_pesanan", filter.noPesanan)
  }
  if (filter?.statusOrderFinal) {
    query = query.eq("status_order_final", filter.statusOrderFinal)
  }
  if (filter?.statusHpp) {
    query = query.eq("status_hpp", filter.statusHpp)
  }
  if (filter?.statusIncome) {
    query = query.eq("status_income", filter.statusIncome)
  }
  if (filter?.storeId) {
    query = query.eq("store_id", filter.storeId)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`no_pesanan.ilike.%${q}%,username_pembeli.ilike.%${q}%`)
  }
  if (filter?.dateFrom) {
    query = query.gte("waktu_pesanan_dibuat", filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte("waktu_pesanan_dibuat", filter.dateTo)
  }

  const { data, error, count } = await query

  if (error) {
    return { headers: [], total: 0, page, pageSize }
  }

  const headers: OrderHeader[] = (data ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    noPesanan: row.no_pesanan ?? "",
    statusPesanan: row.status_pesanan ?? "",
    waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
    waktuPembayaran: row.waktu_pembayaran ?? "",
    metodePembayaran: row.metode_pembayaran ?? "",
    usernamePembeli: row.username_pembeli ?? "",
    ekspedisi: row.ekspedisi ?? undefined,
    kota: row.kota ?? undefined,
    totalQtyOrder: row.total_qty_order ?? 0,
    totalQtyReturn: row.total_qty_return ?? 0,
    totalQtyValid: row.total_qty_valid ?? 0,
    totalOmzetValid: row.total_omzet_valid ?? 0,
    totalOmzetRetur: row.total_omzet_retur ?? 0,
    totalHppValid: row.total_hpp_valid ?? 0,
    totalHppRetur: row.total_hpp_retur ?? 0,
    statusOrderFinal: row.status_order_final ?? "Selesai / Normal",
    incomeAktual: row.income_aktual ?? null,
    statusIncome: row.status_income ?? "Belum Ada Income",
    totalPenyesuaian: row.total_penyesuaian ?? 0,
    profitSebelumPenyesuaian: row.profit_sebelum_penyesuaian ?? 0,
    profitSetelahPenyesuaian: row.profit_setelah_penyesuaian ?? 0,
    statusProfit: row.status_profit ?? "Belum Ada Income",
    statusHpp: row.status_hpp ?? "HPP Kosong",
    itemCount: row.item_count ?? 0,
    importDate: row.import_date ?? "",
  }))

  return { headers, total: count ?? 0, page, pageSize }
}

/**
 * Fetch a single order by noPesanan.
 * Returns the order header with its items.
 */
export async function getOrderDetailAction(
  noPesanan: string
): Promise<{ header: OrderHeader | null; items: OrderItem[]; income: IncomeRecord | null; adjustments: AdjustmentRecord[] }> {
  const client = createSupabaseClient()

  // Fetch header
  const { data: headerData, error: headerError } = await client
    .from("orders")
    .select("*")
    .eq("no_pesanan", noPesanan)
    .single()

  if (headerError || !headerData) return { header: null, items: [], income: null, adjustments: [] }

  const header: OrderHeader = {
    id: headerData.id,
    storeId: headerData.store_id ?? "",
    noPesanan: headerData.no_pesanan ?? "",
    statusPesanan: headerData.status_pesanan ?? "",
    waktuPesananDibuat: headerData.waktu_pesanan_dibuat ?? "",
    waktuPembayaran: headerData.waktu_pembayaran ?? "",
    metodePembayaran: headerData.metode_pembayaran ?? "",
    usernamePembeli: headerData.username_pembeli ?? "",
    ekspedisi: headerData.ekspedisi ?? undefined,
    kota: headerData.kota ?? undefined,
    totalQtyOrder: headerData.total_qty_order ?? 0,
    totalQtyReturn: headerData.total_qty_return ?? 0,
    totalQtyValid: headerData.total_qty_valid ?? 0,
    totalOmzetValid: headerData.total_omzet_valid ?? 0,
    totalOmzetRetur: headerData.total_omzet_retur ?? 0,
    totalHppValid: headerData.total_hpp_valid ?? 0,
    totalHppRetur: headerData.total_hpp_retur ?? 0,
    statusOrderFinal: headerData.status_order_final ?? "Selesai / Normal",
    incomeAktual: headerData.income_aktual ?? null,
    statusIncome: headerData.status_income ?? "Belum Ada Income",
    totalPenyesuaian: headerData.total_penyesuaian ?? 0,
    profitSebelumPenyesuaian: headerData.profit_sebelum_penyesuaian ?? 0,
    profitSetelahPenyesuaian: headerData.profit_setelah_penyesuaian ?? 0,
    statusProfit: headerData.status_profit ?? "Belum Ada Income",
    statusHpp: headerData.status_hpp ?? "HPP Kosong",
    itemCount: headerData.item_count ?? 0,
    importDate: headerData.import_date ?? "",
  }

  // Fetch items
  const { data: itemsData, error: itemsError } = await client
    .from("order_items")
    .select("*")
    .eq("no_pesanan", noPesanan)
    .order("id")

  const items: OrderItem[] = (itemsError || !itemsData)
    ? []
    : (itemsData as RawOrderItem[]).map((row) => ({
        id: row.id,
        storeId: row.store_id ?? "",
        noPesanan: row.no_pesanan ?? "",
        statusPesanan: row.status_pesanan ?? "",
        waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
        ekspedisi: row.ekspedisi ?? undefined,
        kota: row.kota ?? undefined,
        sku: row.sku ?? "",
        skuNormalized: row.sku_normalized ?? row.sku?.toLowerCase().trim() ?? "",
        namaProduk: row.nama_produk ?? "",
        namaVariasi: row.nama_variasi ?? "",
        hargaAwal: row.harga_awal ?? 0,
        hargaSetelahDiskon: row.harga_setelah_diskon ?? 0,
        qtyOrder: row.qty_order ?? 0,
        qtyReturn: row.qty_return ?? 0,
        qtyValid: row.qty_valid ?? 0,
        nilaiItemTotal: row.nilai_item_total ?? 0,
        hargaPerQty: row.harga_per_qty ?? 0,
        omzetValid: row.omzet_valid ?? 0,
        omzetRetur: row.omzet_retur ?? 0,
        hppPerSku: row.hpp_per_sku ?? null,
        hppValid: row.hpp_valid ?? 0,
        hppRetur: row.hpp_retur ?? 0,
        statusItem: (row.status_item as OrderItem["statusItem"]) ?? "NORMAL",
        itemHash: row.item_hash ?? "",
        importDate: row.import_date ?? new Date().toISOString(),
      }))

  // Fetch income record
  const { data: incomeData } = await client
    .from("incomes")
    .select("*")
    .eq("no_pesanan", noPesanan)
    .maybeSingle()

  const income: IncomeRecord | null = incomeData
    ? {
        id: incomeData.id,
        storeId: incomeData.store_id ?? "",
        noPesanan: incomeData.no_pesanan ?? "",
        usernamePembeli: incomeData.username_pembeli ?? "",
        waktuPesananDibuat: incomeData.waktu_pesanan_dibuat ?? "",
        metodePembayaran: incomeData.metode_pembayaran ?? "",
        tanggalDanaDilepaskan: incomeData.tanggal_dana_dilepaskan ?? "",
        hargaAsliProduk: incomeData.harga_asli_produk ?? 0,
        totalDiskonProduk: incomeData.total_diskon_produk ?? 0,
        pengembalianDana: incomeData.pengembalian_dana ?? 0,
        diskonDariShopee: incomeData.diskon_dari_shopee ?? 0,
        voucherPenjual: incomeData.voucher_penjual ?? 0,
        ongkirDibayarPembeli: incomeData.ongkir_dibayar_pembeli ?? 0,
        gratisOngkirShopee: incomeData.gratis_ongkir_shopee ?? 0,
        biayaAdministrasi: incomeData.biaya_administrasi ?? 0,
        biayaLayanan: incomeData.biaya_layanan ?? 0,
        biayaProsesPesanan: incomeData.biaya_proses_pesanan ?? 0,
        biayaKomisiAms: incomeData.biaya_komisi_ams ?? 0,
        totalPenghasilan: incomeData.total_penghasilan ?? 0,
        importDate: incomeData.import_date ?? "",
      }
    : null

  // Fetch adjustment records
  const { data: adjustmentsData } = await client
    .from("adjustments")
    .select("*")
    .eq("no_pesanan_terhubung", noPesanan)
    .order("tanggal_adjustment")

  const adjustments: AdjustmentRecord[] = (adjustmentsData ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    noPesananTerhubung: row.no_pesanan_terhubung ?? "",
    tanggalAdjustment: row.tanggal_adjustment ?? "",
    tipeAdjustment: row.tipe_adjustment ?? "",
    biayaPenyesuaian: row.biaya_penyesuaian ?? 0,
    importDate: row.import_date ?? "",
  }))

  return { header, items, income, adjustments }
}

/**
 * Create a new manual order.
 * Returns the created order header.
 */
export async function createOrderAction(
  _data: Partial<OrderHeader> & { items: Partial<OrderItem>[] }
): Promise<OrderHeader | null> {
  // Stub: return null
  // In production: validate → process → save via OrderSummaryService
  return null
}

/**
 * Delete an order by noPesanan.
 * Deletes items first (FK constraint), then the header.
 * Returns whether the deletion was successful.
 */
export async function deleteOrderAction(noPesanan: string): Promise<boolean> {
  const client = createSupabaseClient()

  // Fetch header to get id
  const { data: header } = await client
    .from("orders")
    .select("id")
    .eq("no_pesanan", noPesanan)
    .single()

  if (!header) return false

  const id = header.id as number

  // Delete items first (FK constraint)
  const { error: itemsError } = await client
    .from("order_items")
    .delete()
    .eq("no_pesanan", noPesanan)

  if (itemsError) {
    return false
  }

  // Delete header
  const { error: headerError } = await client
    .from("orders")
    .delete()
    .eq("id", id)

  if (headerError) {
    return false
  }

  return true
}
