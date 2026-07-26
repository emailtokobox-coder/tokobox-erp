/**
 * @module manual-orders/repositories/ManualOrderSupabaseRepository
 * Supabase-backed ManualOrderRepository implementation.
 *
 * Per PRD Section 5.15 (manualOrders table).
 *
 * Architecture:
 *   Actions → ManualOrderSupabaseRepository → Supabase (PostgREST)
 */

import { SupabaseClient } from "@supabase/supabase-js"
import type { ManualOrder, ManualOrderItem } from "../types/ManualOrder"
import type { ManualOrderFilter } from "../types/ManualOrderFilter"
import type { ManualOrderType, ManualOrderStatus, PaymentMethod } from "../constants/manualOrderStatus"
import type { ManualOrderRepository } from "./ManualOrderRepository"

// ─── Pagination Helper ───

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

async function paginatedQuery<T>(
  client: SupabaseClient,
  table: string,
  filter?: ManualOrderFilter
): Promise<PaginatedResult<T>> {
  let query = client.from(table).select("*", { count: "exact" })

  if (filter?.tipe) {
    query = query.eq("tipe_pesanan", filter.tipe)
  }
  if (filter?.status) {
    query = query.eq("status_order", filter.status)
  }
  if (filter?.storeId) {
    query = query.eq("store_id", filter.storeId)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`no_manual_order.ilike.%${q}%,nama_pelanggan.ilike.%${q}%`)
  }
  if (filter?.dateFrom) {
    query = query.gte("tanggal", filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte("tanggal", filter.dateTo)
  }

  const page = filter?.page ?? 1
  const pageSize = filter?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to).order("created_at", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Gagal query ${table}: ${error.message}`)
  }

  return {
    data: (data ?? []) as T[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

// ─── ManualOrderSupabaseRepository ───

export class ManualOrderSupabaseRepository implements ManualOrderRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /* ─── Queries ─── */

  async findAll(filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }> {
    const result = await paginatedQuery<RawManualOrder>(this.client, "manualOrders", filter)
    return {
      orders: result.data.map(mapManualOrder),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  }

  async findById(id: string): Promise<ManualOrder | null> {
    const { data, error } = await this.client
      .from("manualOrders")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapManualOrder(data as RawManualOrder)
  }

  async findByNoManualOrder(noManualOrder: string): Promise<ManualOrder | null> {
    const { data, error } = await this.client
      .from("manualOrders")
      .select("*")
      .eq("no_manual_order", noManualOrder)
      .single()

    if (error || !data) return null
    return mapManualOrder(data as RawManualOrder)
  }

  async findByStoreId(storeId: string, filter?: ManualOrderFilter): Promise<{ orders: ManualOrder[]; total: number; page: number; pageSize: number }> {
    const result = await paginatedQuery<RawManualOrder>(this.client, "manualOrders", { ...filter, storeId })
    return {
      orders: result.data.map(mapManualOrder),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  }

  /* ─── Mutations ─── */

  async create(data: Partial<ManualOrder>): Promise<ManualOrder> {
    const payload: Record<string, unknown> = {
      store_id: data.storeId,
      no_manual_order: data.noManualOrder,
      tipe_pesanan: data.tipePesanan,
      status_order: data.statusOrder ?? "Draft",
      tanggal: data.tanggal ?? new Date().toISOString().split("T")[0],
      nama_pelanggan: data.namaPelanggan,
      alamat_pelanggan: data.alamat ?? "",
      no_hp: data.noHp,
      ekspedisi: data.ekspedisi ?? "",
      biaya_ongkir: data.biayaOngkir ?? 0,
      diskon_persen: data.diskonPersen ?? 0,
      diskon_nominal: data.diskonNominal ?? 0,
      pajak: data.pajak ?? 0,
      total_harga: data.total ?? 0,
      total_bayar: data.totalBayar ?? 0,
      sisa_pembayaran: data.sisaPembayaran ?? 0,
      dp_persentase: data.dpPersentase ?? null,
      dp_nominal: data.dpNominal ?? null,
      termin_schedule: data.terminSchedule ?? [],
      metode_pembayaran: data.metodePembayaran ?? "cash",
      items: data.items ?? [],
      catatan: data.catatan ?? "",
    }

    const { data: result, error } = await this.client
      .from("manualOrders")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Gagal create manual order: ${error.message}`)
    }

    return mapManualOrder(result as RawManualOrder)
  }

  async update(id: string, data: Partial<ManualOrder>): Promise<ManualOrder | null> {
    const updatePayload: Record<string, unknown> = {}

    if (data.noManualOrder) updatePayload["no_manual_order"] = data.noManualOrder
    if (data.tipePesanan) updatePayload["tipe_pesanan"] = data.tipePesanan
    if (data.statusOrder) updatePayload["status_order"] = data.statusOrder
    if (data.tanggal) updatePayload["tanggal"] = data.tanggal
    if (data.namaPelanggan) updatePayload["nama_pelanggan"] = data.namaPelanggan
    if (data.alamat !== undefined) updatePayload["alamat_pelanggan"] = data.alamat
    if (data.noHp) updatePayload["no_hp"] = data.noHp
    if (data.ekspedisi !== undefined) updatePayload["ekspedisi"] = data.ekspedisi
    if (data.biayaOngkir !== undefined) updatePayload["biaya_ongkir"] = data.biayaOngkir
    if (data.diskonPersen !== undefined) updatePayload["diskon_persen"] = data.diskonPersen
    if (data.diskonNominal !== undefined) updatePayload["diskon_nominal"] = data.diskonNominal
    if (data.pajak !== undefined) updatePayload["pajak"] = data.pajak
    if (data.total !== undefined) updatePayload["total_harga"] = data.total
    if (data.totalBayar !== undefined) updatePayload["total_bayar"] = data.totalBayar
    if (data.sisaPembayaran !== undefined) updatePayload["sisa_pembayaran"] = data.sisaPembayaran
    if (data.dpPersentase !== undefined) updatePayload["dp_persentase"] = data.dpPersentase
    if (data.dpNominal !== undefined) updatePayload["dp_nominal"] = data.dpNominal
    if (data.terminSchedule !== undefined) updatePayload["termin_schedule"] = data.terminSchedule
    if (data.metodePembayaran) updatePayload["metode_pembayaran"] = data.metodePembayaran
    if (data.items) updatePayload["items"] = data.items
    if (data.catatan !== undefined) updatePayload["catatan"] = data.catatan

    const { data: result, error } = await this.client
      .from("manualOrders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null
    return mapManualOrder(result as RawManualOrder)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("manualOrders")
      .delete()
      .eq("id", id)

    if (error) return false
    return true
  }
}

// ─── Raw DB Row Type ───

interface RawManualOrder {
  id: string
  store_id: string
  no_manual_order: string
  tipe_pesanan: string
  tanggal: string
  nama_pelanggan: string
  alamat_pelanggan: string
  no_hp: string
  ekspedisi: string
  biaya_ongkir: number
  diskon_persen: number
  diskon_nominal: number
  pajak: number
  total_harga: number
  total_bayar: number
  sisa_pembayaran: number
  dp_persentase: number | null
  dp_nominal: number | null
  termin_schedule: Record<string, unknown>[]
  status_order: string
  metode_pembayaran: string
  items: ManualOrderItem[]
  catatan: string
  created_at: string
  updated_at: string
}

// ─── Mapper: Raw → Domain ───

function mapManualOrder(row: RawManualOrder): ManualOrder {
  return {
    id: row.id,
    storeId: row.store_id ?? "",
    noManualOrder: row.no_manual_order ?? "",
    tipePesanan: row.tipe_pesanan as ManualOrderType,
    statusOrder: row.status_order as ManualOrderStatus,
    metodePembayaran: row.metode_pembayaran as PaymentMethod,
    namaPelanggan: row.nama_pelanggan ?? "",
    alamat: row.alamat_pelanggan ?? "",
    noHp: row.no_hp ?? "",
    ekspedisi: row.ekspedisi ?? "",
    biayaOngkir: row.biaya_ongkir ?? 0,
    diskonPersen: row.diskon_persen ?? 0,
    diskonNominal: row.diskon_nominal ?? 0,
    pajak: row.pajak ?? 0,
    total: row.total_harga ?? 0,
    totalBayar: row.total_bayar ?? 0,
    sisaPembayaran: row.sisa_pembayaran ?? 0,
    dpPersentase: row.dp_persentase ?? undefined,
    dpNominal: row.dp_nominal ?? undefined,
    terminSchedule: row.termin_schedule ?? [],
    items: row.items ?? [],
    subtotal: (row.items ?? []).reduce((sum, item) => sum + (item.subtotal ?? 0), 0),
    catatan: row.catatan ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
