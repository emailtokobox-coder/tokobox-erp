/**
 * @module inventory/actions
 * Server Actions — bridge between Inventory UI and Supabase repositories.
 *
 * Architecture:
 *   Page (server) → actions → Supabase tables (hppSkus, stockMovements, stockSaldo, orderItems)
 */

"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import type {
  HppSku,
  StockMovement,
  StockSaldo,
  HppIssue,
  InventoryFilter,
} from "../types"
import { buildHppResolver } from "@/features/orders/domain/OrderCalculator"
import { StockSaldoService, toMovementRow } from "../services/StockSaldoService"
import type { SaldoSyncResult } from "../services/StockSaldoService"

// ─── HPP Actions ───

/**
 * Fetch all HPP SKUs for the current store.
 */
export async function getHppListAction(): Promise<HppSku[]> {
  const client = createSupabaseClient();
  const { data } = await client
    .from("hppSkus")
    .select("*")
    .order("sku")

  return (data ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    sku: row.sku ?? "",
    skuNormalized: row.sku_normalized ?? "",
    hpp: row.hpp ?? 0,
    namaProduk: row.nama_produk ?? "",
    updatedAt: row.updated_at ?? "",
  }))
}

/**
 * Save or update HPP for a SKU.
 * Key: store_id + sku_normalized (compound unique)
 * If SKU sama + HPP sama → ignore
 * If SKU sama + HPP berubah → update
 * If SKU baru → insert
 */
export async function saveHppAction(data: {
  sku: string
  skuNormalized: string
  hpp: number
  namaProduk: string
}): Promise<HppSku | null> {
  const client = createSupabaseClient();

  // Check if SKU already exists
  const { data: existing } = await client
    .from("hppSkus")
    .select("*")
    .eq("sku_normalized", data.skuNormalized)
    .maybeSingle()

  if (existing) {
    if (existing.hpp === data.hpp) {
      // Same HPP, no update needed
      return {
        id: existing.id,
        storeId: existing.store_id ?? "",
        sku: existing.sku ?? "",
        skuNormalized: existing.sku_normalized ?? "",
        hpp: existing.hpp ?? 0,
        namaProduk: existing.nama_produk ?? "",
        updatedAt: existing.updated_at ?? "",
      }
    }
    // Update HPP
    const { data: updated } = await client
      .from("hppSkus")
      .update({ hpp: data.hpp, nama_produk: data.namaProduk, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()

    return updated ? {
      id: updated.id,
      storeId: updated.store_id ?? "",
      sku: updated.sku ?? "",
      skuNormalized: updated.sku_normalized ?? "",
      hpp: updated.hpp ?? 0,
      namaProduk: updated.nama_produk ?? "",
      updatedAt: updated.updated_at ?? "",
    } : null
  }

  // Insert new
  const { data: inserted } = await client
    .from("hppSkus")
    .insert({
      sku: data.sku,
      sku_normalized: data.skuNormalized,
      hpp: data.hpp,
      nama_produk: data.namaProduk,
    })
    .select()
    .single()

  return inserted ? {
    id: inserted.id,
    storeId: inserted.store_id ?? "",
    sku: inserted.sku ?? "",
    skuNormalized: inserted.sku_normalized ?? "",
    hpp: inserted.hpp ?? 0,
    namaProduk: inserted.nama_produk ?? "",
    updatedAt: inserted.updated_at ?? "",
  } : null
}

/**
 * Delete HPP for a SKU.
 */
export async function deleteHppAction(skuNormalized: string): Promise<boolean> {
  const client = createSupabaseClient();
  const { error } = await client
    .from("hppSkus")
    .delete()
    .eq("sku_normalized", skuNormalized)

  return !error
}

// ─── Stock Saldo Actions ───

/**
 * Fetch all stock saldo.
 */
export async function getStockSaldoAction(): Promise<StockSaldo[]> {
  const client = createSupabaseClient();
  const { data } = await client
    .from("stockSaldo")
    .select("*")
    .order("base_product")

  return (data ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    baseProduct: row.base_product ?? "",
    saldo: row.saldo ?? 0,
    lastUpdated: row.last_updated ?? "",
  }))
}

/**
 * Update stock saldo for a base product.
 */
export async function updateStockSaldoAction(data: {
  baseProduct: string
  saldo: number
}): Promise<StockSaldo | null> {
  const client = createSupabaseClient();

  const { data: existing } = await client
    .from("stockSaldo")
    .select("*")
    .eq("base_product", data.baseProduct)
    .maybeSingle()

  if (existing) {
    const { data: updated } = await client
      .from("stockSaldo")
      .update({ saldo: data.saldo, last_updated: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()

    return updated ? {
      id: updated.id,
      storeId: updated.store_id ?? "",
      baseProduct: updated.base_product ?? "",
      saldo: updated.saldo ?? 0,
      lastUpdated: updated.last_updated ?? "",
    } : null
  }

  const { data: inserted } = await client
    .from("stockSaldo")
    .insert({ base_product: data.baseProduct, saldo: data.saldo })
    .select()
    .single()

  return inserted ? {
    id: inserted.id,
    storeId: inserted.store_id ?? "",
    baseProduct: inserted.base_product ?? "",
    saldo: inserted.saldo ?? 0,
    lastUpdated: inserted.last_updated ?? "",
  } : null
}

// ─── Stock Movement Actions ───

/**
 * Fetch stock movements with optional filters.
 * Per PRD 5.8: stock_movements table tracks all stock in/out events.
 */
export async function getStockMovementsAction(
  filter?: InventoryFilter
): Promise<StockMovement[]> {
  const client = createSupabaseClient();
  let query = client.from("stockMovements").select("*").order("tanggal", { ascending: false })

  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`base_product.ilike.%${q}%,supplier.ilike.%${q}%`)
  }
  if (filter?.tipe) {
    query = query.eq("tipe", filter.tipe)
  }
  if (filter?.source) {
    query = query.eq("source", filter.source)
  }
  if (filter?.dateFrom) {
    query = query.gte("tanggal", filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte("tanggal", filter.dateTo)
  }

  const { data } = await query

  return (data ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    baseProduct: row.base_product ?? "",
    tipe: row.tipe as StockMovement["tipe"],
    tanggal: row.tanggal ?? "",
    noRef: row.no_ref ?? "",
    qtyBaseUnit: row.qty_base_unit ?? 0,
    source: row.source as StockMovement["source"],
    supplier: row.supplier ?? "",
    keterangan: row.keterangan ?? "",
    createdAt: row.created_at ?? "",
  }))
}

/**
 * Create a stock movement record manually.
 */
export async function createStockMovementAction(data: {
  baseProduct: string
  tipe: StockMovement["tipe"]
  tanggal: string
  qtyBaseUnit: number
  source: StockMovement["source"]
  supplier?: string
  keterangan?: string
}): Promise<StockMovement | null> {
  const client = createSupabaseClient();
  const { data: inserted } = await client
    .from("stockMovements")
    .insert({
      base_product: data.baseProduct,
      tipe: data.tipe,
      tanggal: data.tanggal,
      qty_base_unit: data.qtyBaseUnit,
      source: data.source,
      supplier: data.supplier ?? "",
      keterangan: data.keterangan ?? "",
    })
    .select()
    .single()

  return inserted ? {
    id: inserted.id,
    storeId: inserted.store_id ?? "",
    baseProduct: inserted.base_product ?? "",
    tipe: inserted.tipe as StockMovement["tipe"],
    tanggal: inserted.tanggal ?? "",
    noRef: inserted.no_ref ?? "",
    qtyBaseUnit: inserted.qty_base_unit ?? 0,
    source: inserted.source as StockMovement["source"],
    supplier: inserted.supplier ?? "",
    keterangan: inserted.keterangan ?? "",
    createdAt: inserted.created_at ?? "",
  } : null
}

// ─── Stock Saldo Sync Actions (Iter 45) ───

/**
 * Sync stock saldo from all stock movements.
 * Fetches all stockMovements → computes saldo per base_product → idempotent upsert into stockSaldo.
 * Returns counts for synced, skipped, and errors.
 *
 * Idempotent: same saldo → skip, different → update, new → insert.
 */
export async function syncStockSaldoAction(): Promise<
  SaldoSyncResult & { warnings: string[] }
> {
  const client = createSupabaseClient();

  // Fetch all stock movements
  const { data: movementsData } = await client
    .from("stockMovements")
    .select("*")

  const movements: StockMovement[] = (movementsData ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    baseProduct: row.base_product ?? "",
    tipe: row.tipe as StockMovement["tipe"],
    tanggal: row.tanggal ?? "",
    noRef: row.no_ref ?? "",
    qtyBaseUnit: row.qty_base_unit ?? 0,
    source: row.source as StockMovement["source"],
    supplier: row.supplier ?? "",
    keterangan: row.keterangan ?? "",
    createdAt: row.created_at ?? "",
  }))

  if (movements.length === 0) {
    return {
      syncedCount: 0,
      skippedCount: 0,
      errors: [],
      warnings: ["Tidak ada pergerakan stok untuk disinkronkan."],
    }
  }

  // Convert StockMovement[] → StockMovementRow[] (filter non-daily types)
  const rows: Parameters<typeof StockSaldoService.computeSaldoFromMovements>[0] = []
  for (const m of movements) {
    const row = toMovementRow(m)
    if (row) rows.push(row)
  }

  // Compute saldo from movements
  const saldoMap = StockSaldoService.computeSaldoFromMovements(rows)

  // Detect negative saldo warnings
  const warnings: string[] = []
  for (const [baseProduct, saldo] of saldoMap) {
    if (saldo < 0) {
      warnings.push(
        `Saldo negatif untuk ${baseProduct}: ${saldo}`,
      )
    }
  }

  // Upsert into stockSaldo table
  const syncResult = await StockSaldoService.syncStockSaldo(client, saldoMap)

  return {
    ...syncResult,
    warnings,
  }
}

/**
 * Get the last sync date from stockSaldo table.
 * Returns the most recent last_updated timestamp across all records.
 */
export async function getLastSyncDateAction(): Promise<{
  lastSyncAt: string | null
}> {
  const client = createSupabaseClient();
  const { data } = await client
    .from("stockSaldo")
    .select("last_updated")
    .order("last_updated", { ascending: false })
    .limit(1)

  return {
    lastSyncAt: data?.[0]?.last_updated ?? null,
  }
}

// ─── HPP Resolver Actions ───

/**
 * Fetch HPP issues — SKUs without HPP that still have valid orders.
 * Reuses buildHppResolver from OrderCalculator domain.
 */
export async function getHppResolverAction(): Promise<HppIssue[]> {
  const client = createSupabaseClient();

  // Fetch order items without HPP
  const { data: itemsData } = await client
    .from("orderItems")
    .select("*")
    .or("hpp_per_sku.is.null,hpp_per_sku.eq.0")
    .neq("status_item", "BATAL")
    .neq("qty_valid", 0)

  const items = (itemsData ?? []).map((row) => ({
    storeId: row.store_id ?? "",
    noPesanan: row.no_pesanan ?? "",
    statusPesanan: row.status_pesanan ?? "",
    waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
    ekspedisi: row.ekspedisi ?? undefined,
    kota: row.kota ?? undefined,
    sku: row.sku ?? "",
    skuNormalized: row.sku_normalized ?? "",
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
    statusItem: row.status_item ?? "NORMAL",
    itemHash: row.item_hash ?? "",
    importDate: row.import_date ?? "",
  }))

  return buildHppResolver(items)
}
