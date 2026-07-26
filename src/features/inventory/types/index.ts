/**
 * @module inventory/types
 * Inventory types — HPP SKU, stock movements, stock saldo, HPP resolver issues.
 */

// ─── HPP SKU (PRD 5.6) ───

export interface HppSku {
  id?: string
  storeId: string
  sku: string
  skuNormalized: string
  hpp: number
  namaProduk: string
  updatedAt: string
}

// ─── Stock Movement (PRD 5.8) ───

export interface StockMovement {
  id?: string
  storeId: string
  baseProduct: string
  tipe: "MASUK" | "KELUAR" | "OPNAME" | "SALDO_AWAL"
  tanggal: string
  noRef: string
  qtyBaseUnit: number
  source: "manual" | "shopee" | "opname" | "invoice" | "saldo_awal" | "import"
  supplier: string
  keterangan: string
  createdAt: string
}

// ─── Stock Saldo (PRD 5.11) ───

export interface StockSaldo {
  id?: string
  storeId: string
  baseProduct: string
  saldo: number
  lastUpdated: string
}

// ─── Stock Alert (PRD 5.9) ───

export interface StockAlert {
  id?: string
  storeId: string
  baseProduct: string
  minHari: number
  updatedAt: string
}

// ─── Stock Opname (PRD 5.10) ───

export interface StockOpname {
  id?: string
  storeId: string
  tanggalOpname: string
  items: StockOpnameItem[]
  catatan: string
  createdAt: string
}

export interface StockOpnameItem {
  baseProduct: string
  qtySistem: number
  qtyFisik: number
  selisih: number
}

// ─── HPP Issue (PRD 3.16, 7.8) ───

export interface HppIssue {
  sku: string
  skuNormalized: string
  namaProduk: string
  orderCount: number
  qtyValidTerdampak: number
  omzetTerkait: number
  contohNoPesanan: string[]
}

// ─── Inventory Filter ───

export interface InventoryFilter {
  search?: string
  tipe?: string
  source?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Stock Movement Row (for DB insertion, PRD 5.8) ───

export interface StockMovementRow {
  baseProduct: string
  tipe: "MASUK" | "KELUAR"
  tanggal: string
  noRef: string
  qtyBaseUnit: number
  source: "shopee"
  supplier: string
  keterangan: string
}
