/**
 * @module orders/repositories/OrderSupabaseRepository
 * Supabase-backed OrderRepository implementation using DbTransaction.
 *
 * Replaces the in-memory stub with real PostgREST operations.
 * All write operations require an active transaction via DbTransaction.
 *
 * Architecture:
 *   UI → Actions → Services → Repositories → DbTransaction → Supabase
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { OrderRepository } from "./OrderRepository"
import type { OrderItem, OrderHeader } from "../types/OrderItem"
import type { OrderFilter } from "../types/OrderFilter"
import { mapOrderItem, mapOrderItems, RawOrderItem } from "../mappers/OrderItemMapper"
import { mapOrderHeader, mapOrderHeaders, RawOrderHeader } from "../mappers/OrderMapper"

/* ─── Pagination Helper ─── */

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

async function paginatedQuery<T>(
  client: SupabaseClient,
  table: string,
  filter?: OrderFilter
): Promise<PaginatedResult<T>> {
  let query = client.from(table).select("*", { count: "exact" })

  if (filter?.noPesanan) {
    query = query.eq("no_pesanan", filter.noPesanan)
  }
  if (filter?.statusOrderFinal) {
    query = query.eq("status_order_final", filter.statusOrderFinal)
  }
  if (filter?.storeId) {
    query = query.eq("store_id", filter.storeId)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`no_pesanan.ilike.%${q}%,nama_produk.ilike.%${q}%,sku.ilike.%${q}%`)
  }
  if (filter?.dateFrom) {
    query = query.gte("waktu_pesanan_dibuat", filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte("waktu_pesanan_dibuat", filter.dateTo)
  }

  const page = filter?.page ?? 1
  const pageSize = filter?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to).order("waktu_pesanan_dibuat", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Gagal query ${table}: ${error.message}`)
  }

  return {
    data: (data as unknown) as T[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

/* ─── OrderSupabaseRepository ─── */

export class OrderSupabaseRepository implements OrderRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /* ─── Items ─── */

  async findItems(filter?: OrderFilter): Promise<OrderItem[]> {
    const result = await paginatedQuery<RawOrderItem>(this.client, "order_items", filter)
    return mapOrderItems(result.data)
  }

  async findItemById(id: number): Promise<OrderItem | null> {
    const { data, error } = await this.client
      .from("order_items")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapOrderItem(data as RawOrderItem)
  }

  async findItemsByOrder(noPesanan: string): Promise<OrderItem[]> {
    const { data, error } = await this.client
      .from("order_items")
      .select("*")
      .eq("no_pesanan", noPesanan)
      .order("id")

    if (error || !data) return []
    return mapOrderItems(data as RawOrderItem[])
  }

  async insertItem(item: OrderItem): Promise<OrderItem> {
    const payload: Record<string, unknown> = {
      store_id: item.storeId,
      no_pesanan: item.noPesanan,
      status_pesanan: item.statusPesanan,
      waktu_pesanan_dibuat: item.waktuPesananDibuat,
      sku: item.sku,
      sku_normalized: item.skuNormalized,
      nama_produk: item.namaProduk,
      nama_variasi: item.namaVariasi,
      harga_awal: item.hargaAwal,
      harga_setelah_diskon: item.hargaSetelahDiskon,
      qty_order: item.qtyOrder,
      qty_return: item.qtyReturn,
      qty_valid: item.qtyValid,
      nilai_item_total: item.nilaiItemTotal,
      harga_per_qty: item.hargaPerQty,
      omzet_valid: item.omzetValid,
      omzet_retur: item.omzetRetur,
      hpp_per_sku: item.hppPerSku,
      hpp_valid: item.hppValid,
      hpp_retur: item.hppRetur,
      status_item: item.statusItem,
      item_hash: item.itemHash,
      import_date: item.importDate,
    }

    const { data, error } = await this.client.from("order_items").insert(payload).select().single()

    if (error) {
      throw new Error(`Gagal insert order_item: ${error.message}`)
    }

    return mapOrderItem(data as RawOrderItem)
  }

  async insertItems(items: OrderItem[]): Promise<OrderItem[]> {
    const payload = items.map((item) => ({
      store_id: item.storeId,
      no_pesanan: item.noPesanan,
      status_pesanan: item.statusPesanan,
      waktu_pesanan_dibuat: item.waktuPesananDibuat,
      sku: item.sku,
      sku_normalized: item.skuNormalized,
      nama_produk: item.namaProduk,
      nama_variasi: item.namaVariasi,
      harga_awal: item.hargaAwal,
      harga_setelah_diskon: item.hargaSetelahDiskon,
      qty_order: item.qtyOrder,
      qty_return: item.qtyReturn,
      qty_valid: item.qtyValid,
      nilai_item_total: item.nilaiItemTotal,
      harga_per_qty: item.hargaPerQty,
      omzet_valid: item.omzetValid,
      omzet_retur: item.omzetRetur,
      hpp_per_sku: item.hppPerSku,
      hpp_valid: item.hppValid,
      hpp_retur: item.hppRetur,
      status_item: item.statusItem,
      item_hash: item.itemHash,
      import_date: item.importDate,
    }))

    const { data, error } = await this.client.from("order_items").insert(payload).select()

    if (error) {
      throw new Error(`Gagal insert order_items: ${error.message}`)
    }

    return mapOrderItems(data as RawOrderItem[])
  }

  /* ─── Headers ─── */

  async findHeaders(filter?: OrderFilter): Promise<OrderHeader[]> {
    const result = await paginatedQuery<RawOrderHeader>(this.client, "orders", filter)
    return mapOrderHeaders(result.data)
  }

  async findHeaderById(id: number): Promise<OrderHeader | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapOrderHeader(data as RawOrderHeader)
  }

  async findHeaderByNoPesanan(noPesanan: string): Promise<OrderHeader | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("no_pesanan", noPesanan)
      .single()

    if (error || !data) return null
    return mapOrderHeader(data as RawOrderHeader)
  }

  async insertHeader(header: OrderHeader): Promise<OrderHeader> {
    const payload: Record<string, unknown> = {
      store_id: header.storeId,
      no_pesanan: header.noPesanan,
      status_pesanan: header.statusPesanan,
      waktu_pesanan_dibuat: header.waktuPesananDibuat,
      waktu_pembayaran: header.waktuPembayaran,
      metode_pembayaran: header.metodePembayaran,
      username_pembeli: header.usernamePembeli,
      ekspedisi: header.ekspedisi ?? null,
      kota: header.kota ?? null,
      total_qty_order: header.totalQtyOrder,
      total_qty_return: header.totalQtyReturn,
      total_qty_valid: header.totalQtyValid,
      total_omzet_valid: header.totalOmzetValid,
      total_omzet_retur: header.totalOmzetRetur,
      total_hpp_valid: header.totalHppValid,
      total_hpp_retur: header.totalHppRetur,
      status_order_final: header.statusOrderFinal,
      income_aktual: header.incomeAktual,
      status_income: header.statusIncome,
      total_penyesuaian: header.totalPenyesuaian,
      profit_sebelum_penyesuaian: header.profitSebelumPenyesuaian,
      profit_setelah_penyesuaian: header.profitSetelahPenyesuaian,
      status_profit: header.statusProfit,
      status_hpp: header.statusHpp,
      item_count: header.itemCount,
      import_date: header.importDate,
    }

    const { data, error } = await this.client.from("orders").insert(payload).select().single()

    if (error) {
      throw new Error(`Gagal insert order header: ${error.message}`)
    }

    return mapOrderHeader(data as RawOrderHeader)
  }

  async insertHeaders(headers: OrderHeader[]): Promise<OrderHeader[]> {
    const payload = headers.map((h) => ({
      store_id: h.storeId,
      no_pesanan: h.noPesanan,
      status_pesanan: h.statusPesanan,
      waktu_pesanan_dibuat: h.waktuPesananDibuat,
      waktu_pembayaran: h.waktuPembayaran,
      metode_pembayaran: h.metodePembayaran,
      username_pembeli: h.usernamePembeli,
      ekspedisi: h.ekspedisi ?? null,
      kota: h.kota ?? null,
      total_qty_order: h.totalQtyOrder,
      total_qty_return: h.totalQtyReturn,
      total_qty_valid: h.totalQtyValid,
      total_omzet_valid: h.totalOmzetValid,
      total_omzet_retur: h.totalOmzetRetur,
      total_hpp_valid: h.totalHppValid,
      total_hpp_retur: h.totalHppRetur,
      status_order_final: h.statusOrderFinal,
      income_aktual: h.incomeAktual,
      status_income: h.statusIncome,
      total_penyesuaian: h.totalPenyesuaian,
      profit_sebelum_penyesuaian: h.profitSebelumPenyesuaian,
      profit_setelah_penyesuaian: h.profitSetelahPenyesuaian,
      status_profit: h.statusProfit,
      status_hpp: h.statusHpp,
      item_count: h.itemCount,
      import_date: h.importDate,
    }))

    const { data, error } = await this.client.from("orders").insert(payload).select()

    if (error) {
      throw new Error(`Gagal insert order headers: ${error.message}`)
    }

    return mapOrderHeaders(data as RawOrderHeader[])
  }

  async updateHeader(id: number, data: Partial<OrderHeader>): Promise<OrderHeader | null> {
    const updatePayload: Record<string, string | number | null> = {}

    if (data.incomeAktual !== undefined) updatePayload["income_aktual"] = data.incomeAktual
    if (data.statusIncome) updatePayload["status_income"] = data.statusIncome
    if (data.totalPenyesuaian !== undefined) updatePayload["total_penyesuaian"] = data.totalPenyesuaian
    if (data.profitSebelumPenyesuaian !== undefined) updatePayload["profit_sebelum_penyesuaian"] = data.profitSebelumPenyesuaian
    if (data.profitSetelahPenyesuaian !== undefined) updatePayload["profit_setelah_penyesuaian"] = data.profitSetelahPenyesuaian
    if (data.statusProfit) updatePayload["status_profit"] = data.statusProfit
    if (data.statusOrderFinal) updatePayload["status_order_final"] = data.statusOrderFinal
    if (data.statusHpp) updatePayload["status_hpp"] = data.statusHpp

    const { data: result, error } = await this.client
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null
    return mapOrderHeader(result as RawOrderHeader)
  }

  async deleteHeader(id: number): Promise<boolean> {
    const { error } = await this.client.from("orders").delete().eq("id", id)

    if (error) return false
    return true
  }

  /* ─── Bulk ─── */

  async clearAll(): Promise<void> {
    await this.client.from("order_items").delete().neq("id", 0)
    await this.client.from("orders").delete().neq("id", 0)
  }
}
