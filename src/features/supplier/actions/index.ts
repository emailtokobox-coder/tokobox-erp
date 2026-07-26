/**
 * @module supplier/actions
 * Server Actions — bridge between Supplier UI and Supabase.
 *
 * Architecture:
 *   Page (server) → actions → Supabase tables (suppliers, supplierPrices)
 *
 * Per PRD 5.13, 5.14:
 *   - suppliers table: CRUD for supplier master data
 *   - supplierPrices table: price history per supplier per base_product
 */

import { createSupabaseClient } from "@/lib/supabase/client"
import type { Supplier, SupplierPrice, SupplierFilter, SupplierFormData } from "../types"

// ─── Helper: slugify nama → id ───

function slugifyNama(nama: string): string {
  return nama
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ─── Supplier Actions ───

/**
 * Fetch all suppliers with optional filters.
 */
export async function getSuppliersAction(
  filter?: SupplierFilter
): Promise<Supplier[]> {
  const client = createSupabaseClient()

  let query = client
    .from("suppliers")
    .select("*")
    .order("nama", { ascending: true })

  if (filter?.aktif !== undefined) {
    query = query.eq("aktif", filter.aktif)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`nama.ilike.%${q}%,kontak.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data } = await query

  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    storeId: row.store_id ?? "",
    nama: row.nama ?? "",
    kontak: row.kontak ?? "",
    email: row.email ?? "",
    alamat: row.alamat ?? "",
    produk: row.produk ?? [],
    leadTimeHari: row.lead_time_hari ?? 7,
    aktif: row.aktif ?? true,
    catatan: row.catatan ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  }))
}

/**
 * Fetch single supplier by ID.
 */
export async function getSupplierAction(id: string): Promise<Supplier | null> {
  const client = createSupabaseClient()

  const { data } = await client
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) return null

  return {
    id: data.id ?? "",
    storeId: data.store_id ?? "",
    nama: data.nama ?? "",
    kontak: data.kontak ?? "",
    email: data.email ?? "",
    alamat: data.alamat ?? "",
    produk: data.produk ?? [],
    leadTimeHari: data.lead_time_hari ?? 7,
    aktif: data.aktif ?? true,
    catatan: data.catatan ?? "",
    createdAt: data.created_at ?? "",
    updatedAt: data.updated_at ?? "",
  }
}

/**
 * Create new supplier.
 * id = slugified nama (primary key per PRD schema).
 */
export async function createSupplierAction(
  data: SupplierFormData
): Promise<Supplier | null> {
  const client = createSupabaseClient()
  const id = slugifyNama(data.nama)

  const { data: inserted } = await client
    .from("suppliers")
    .insert({
      id,
      nama: data.nama,
      kontak: data.kontak,
      email: data.email,
      alamat: data.alamat,
      produk: data.produk,
      lead_time_hari: data.leadTimeHari,
      aktif: data.aktif,
      catatan: data.catatan,
    })
    .select()
    .single()

  return inserted ? {
    id: inserted.id ?? "",
    storeId: inserted.store_id ?? "",
    nama: inserted.nama ?? "",
    kontak: inserted.kontak ?? "",
    email: inserted.email ?? "",
    alamat: inserted.alamat ?? "",
    produk: inserted.produk ?? [],
    leadTimeHari: inserted.lead_time_hari ?? 7,
    aktif: inserted.aktif ?? true,
    catatan: inserted.catatan ?? "",
    createdAt: inserted.created_at ?? "",
    updatedAt: inserted.updated_at ?? "",
  } : null
}

/**
 * Update existing supplier.
 */
export async function updateSupplierAction(
  id: string,
  data: Partial<SupplierFormData>
): Promise<Supplier | null> {
  const client = createSupabaseClient()

  const { nama, kontak, email, alamat, produk, leadTimeHari, aktif, catatan } = data
  const updateData: Record<string, unknown> = {}
  if (nama !== undefined) updateData['nama'] = nama
  if (kontak !== undefined) updateData['kontak'] = kontak
  if (email !== undefined) updateData['email'] = email
  if (alamat !== undefined) updateData['alamat'] = alamat
  if (produk !== undefined) updateData['produk'] = produk
  if (leadTimeHari !== undefined) updateData['lead_time_hari'] = leadTimeHari
  if (aktif !== undefined) updateData['aktif'] = aktif
  if (catatan !== undefined) updateData['catatan'] = catatan

  const { data: updated } = await client
    .from("suppliers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  return updated ? {
    id: updated.id ?? "",
    storeId: updated.store_id ?? "",
    nama: updated.nama ?? "",
    kontak: updated.kontak ?? "",
    email: updated.email ?? "",
    alamat: updated.alamat ?? "",
    produk: updated.produk ?? [],
    leadTimeHari: updated.lead_time_hari ?? 7,
    aktif: updated.aktif ?? true,
    catatan: updated.catatan ?? "",
    createdAt: updated.created_at ?? "",
    updatedAt: updated.updated_at ?? "",
  } : null
}

/**
 * Delete supplier (hard delete per PRD — no soft delete specified).
 */
export async function deleteSupplierAction(id: string): Promise<boolean> {
  const client = createSupabaseClient()

  const { error } = await client
    .from("suppliers")
    .delete()
    .eq("id", id)

  return !error
}

// ─── Supplier Price Actions ───

/**
 * Fetch price history for a supplier.
 */
export async function getSupplierPricesAction(
  supplierId: string
): Promise<SupplierPrice[]> {
  const client = createSupabaseClient()

  const { data } = await client
    .from("supplierPrices")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("berlaku_mulai", { ascending: false })

  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    supplierId: row.supplier_id ?? "",
    baseProduct: row.base_product ?? "",
    hargaBeli: row.harga_beli ?? 0,
    berlakuMulai: row.berlaku_mulai ?? "",
    catatan: row.catatan ?? "",
    createdAt: row.created_at ?? "",
  }))
}

/**
 * Create new supplier price entry.
 */
export async function createSupplierPriceAction(data: {
  supplierId: string
  baseProduct: string
  hargaBeli: number
  berlakuMulai: string
  catatan?: string
}): Promise<SupplierPrice | null> {
  const client = createSupabaseClient()

  const { data: inserted } = await client
    .from("supplierPrices")
    .insert({
      supplier_id: data.supplierId,
      base_product: data.baseProduct,
      harga_beli: data.hargaBeli,
      berlaku_mulai: data.berlakuMulai,
      catatan: data.catatan ?? "",
    })
    .select()
    .single()

  return inserted ? {
    id: inserted.id ?? "",
    supplierId: inserted.supplier_id ?? "",
    baseProduct: inserted.base_product ?? "",
    hargaBeli: inserted.harga_beli ?? 0,
    berlakuMulai: inserted.berlaku_mulai ?? "",
    catatan: inserted.catatan ?? "",
    createdAt: inserted.created_at ?? "",
  } : null
}
