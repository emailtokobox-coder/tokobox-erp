/**
 * @module supplier/types/Supplier
 * Supplier types — matches Supabase `suppliers` and `supplierPrices` tables.
 *
 * Per PRD 5.13, 5.14:
 *   - suppliers: id (slugified nama), store_id, nama, kontak, email, alamat, produk, lead_time_hari, aktif
 *   - supplierPrices: supplier_id, base_product, harga_beli, berlaku_mulai
 */

export interface Supplier {
  id: string
  storeId: string
  nama: string
  kontak: string
  email: string
  alamat: string
  produk: string[]
  leadTimeHari: number
  aktif: boolean
  catatan: string
  createdAt: string
  updatedAt: string
}

export interface SupplierPrice {
  id: string
  supplierId: string
  supplierNama?: string
  baseProduct: string
  hargaBeli: number
  berlakuMulai: string
  catatan: string
  createdAt: string
}

export interface SupplierFilter {
  search?: string
  aktif?: boolean
}

export interface SupplierFormData {
  nama: string
  kontak: string
  email: string
  alamat: string
  produk: string[]
  leadTimeHari: number
  aktif: boolean
  catatan: string
}
