/**
 * @module upload/repositories/UploadSupabaseRepository
 * Supabase-backed UploadRepository implementation using DbTransaction.
 *
 * Handles bulk inserts for all import types (orders, income, adjustments, HPP, grosir).
 * Designed to work within a DbTransaction for atomic multi-table imports.
 *
 * Architecture:
 *   UI → Actions → Services → Repositories → DbTransaction → Supabase
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { UploadRepository } from "./UploadRepository"
import type {
  OrderHeaderProcessed,
  OrderItemProcessed,
  IncomeRow,
  AdjustmentRow,
  HppRow,
  GrosirRow,
} from "../types"
import type { OrderHeader, OrderItem } from "../../orders/types/OrderItem"
import { mapOrderHeader } from "../../orders/mappers/OrderMapper"
import { mapOrderItem } from "../../orders/mappers/OrderItemMapper"

/* ─── UploadSupabaseRepository ─── */

export class UploadSupabaseRepository implements UploadRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /* ─── Orders ─── */

  async bulkInsertOrderHeaders(headers: OrderHeaderProcessed[]): Promise<OrderHeader[]> {
    if (headers.length === 0) return []

    const payload = headers.map((h) => ({
      no_pesanan: h.noPesanan,
      store_id: h.storeId,
      total_qty_order: h.totalQtyOrder,
      total_qty_return: h.totalQtyReturn,
      total_qty_valid: h.totalQtyValid,
      total_omzet_valid: h.totalOmzetValid,
      total_omzet_retur: h.totalOmzetRetur,
      total_hpp_valid: h.totalHppValid,
      total_hpp_retur: h.totalHppRetur,
      status_order_final: h.statusOrderFinal,
      status_hpp: h.statusHpp,
      status_income: h.statusIncome,
      status_profit: h.statusProfit,
    }))

    const { data, error } = await this.client.from("orders").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert order headers: ${error.message}`)
    }

    return (data as unknown[]).map((row) => mapOrderHeader(row as Parameters<typeof mapOrderHeader>[0]))
  }

  async bulkInsertOrderItems(items: OrderItemProcessed[]): Promise<OrderItem[]> {
    if (items.length === 0) return []

    const payload = items.map((item) => ({
      no_pesanan: item.noPesanan,
      sku: item.sku,
      nama_produk: item.namaProduk,
      nama_variasi: item.namaVariasi ?? null,
      qty_order: item.qtyOrder,
      qty_return: item.qtyReturn,
      qty_valid: item.qtyValid,
      harga_per_qty: item.hargaPerQty,
      omzet_valid: item.omzetValid,
      omzet_retur: item.omzetRetur,
      hpp_valid: item.hppValid,
      hpp_retur: item.hppRetur,
      status_item: item.statusItem,
      item_hash: item.itemHash,
    }))

    const { data, error } = await this.client.from("order_items").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert order items: ${error.message}`)
    }

    return (data as unknown[]).map((row) => mapOrderItem(row as Parameters<typeof mapOrderItem>[0]))
  }

  /* ─── Income ─── */

  async bulkInsertIncome(rows: IncomeRow[]): Promise<IncomeRow[]> {
    if (rows.length === 0) return []

    const payload = rows.map((row) => ({
      no_pesanan: row.noPesanan,
      no_pengajuan: row.noPengajuan,
      waktu_pesanan_dibuat: row.waktuPesananDibuat,
      metode_pembayaran: row.metodePembayaran,
      tanggal_dana_dilepaskan: row.tanggalDanaDilepaskan,
      harga_asli_produk: row.hargaAsliProduk,
      total_diskon_produk: row.totalDiskonProduk,
      refund_buyer: row.refundBuyer,
      ongkir_dibayar_pembeli: row.ongkirDibayarPembeli,
      gratis_ongkir_shopee: row.gratisOngkirShopee,
      ongkir_diteruskan_ke_jasa_kirim: row.ongkirDiteruskanKeJasaKirim,
      ongkir_pengembalian: row.ongkirPengembalian,
      biaya_komisi_ams: row.biayaKomisiAms,
      biaya_administrasi: row.biayaAdministrasi,
      biaya_layanan: row.biayaLayanan,
      biaya_proses_pesanan: row.biayaProsesPesanan,
      income_aktual: row.incomeAktual,
    }))

    const { data, error } = await this.client.from("income").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert income: ${error.message}`)
    }

    return data as IncomeRow[]
  }

  /* ─── Adjustments ─── */

  async bulkInsertAdjustments(rows: AdjustmentRow[]): Promise<AdjustmentRow[]> {
    if (rows.length === 0) return []

    const payload = rows.map((row) => ({
      no: row.no,
      tanggal_adjustment: row.tanggalAdjustment,
      tipe_adjustment: row.tipeAdjustment,
      alasan_adjustment: row.alasanAdjustment,
      biaya_penyesuaian: row.biayaPenyesuaian,
      no_pesanan_terhubung: row.noPesananTerhubung,
      tanggal_dana_dilepaskan: row.tanggalDanaDilepaskan,
    }))

    const { data, error } = await this.client.from("adjustments").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert adjustments: ${error.message}`)
    }

    return data as AdjustmentRow[]
  }

  /* ─── HPP ─── */

  async bulkInsertHpp(rows: HppRow[]): Promise<HppRow[]> {
    if (rows.length === 0) return []

    const payload = rows.map((row) => ({
      sku: row.sku,
      hpp: row.hpp,
      nama_produk: row.namaProduk ?? null,
    }))

    const { data, error } = await this.client.from("hpp").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert HPP: ${error.message}`)
    }

    return data as HppRow[]
  }

  /* ─── Grosir ─── */

  async bulkInsertGrosir(rows: GrosirRow[]): Promise<GrosirRow[]> {
    if (rows.length === 0) return []

    const payload = rows.map((row) => ({
      sku: row.sku,
      base_harga: row.baseHarga,
      min_qty: row.minQty,
      harga_grosir: row.hargaGrosir,
      mulai_berlaku: row.mulaiBerlaku,
      berlaku_sampai: row.berlakuSampai ?? null,
      catatan: row.catatan ?? null,
    }))

    const { data, error } = await this.client.from("grosir").insert(payload).select()

    if (error) {
      throw new Error(`Gagal bulk insert grosir: ${error.message}`)
    }

    return data as GrosirRow[]
  }

  /* ─── Exists Checks (for idempotency) ─── */

  async findIncomeByNoPesanan(noPesanan: string): Promise<IncomeRow | null> {
    const { data, error } = await this.client
      .from("income")
      .select("*")
      .eq("no_pesanan", noPesanan)
      .single()

    if (error || !data) return null
    return data as IncomeRow
  }

  async findHppBySku(sku: string): Promise<HppRow | null> {
    const { data, error } = await this.client
      .from("hpp")
      .select("*")
      .eq("sku", sku)
      .single()

    if (error || !data) return null
    return data as HppRow
  }

  async findGrosirBySku(sku: string): Promise<GrosirRow[]> {
    const { data, error } = await this.client
      .from("grosir")
      .select("*")
      .eq("sku", sku)

    if (error || !data) return []
    return data as GrosirRow[]
  }
}
