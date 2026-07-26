/**
 * @module orders/types
 * Core domain types for the Orders feature.
 *
 * Ported from shopee-erp/src/data/types/index.ts
 */

// ─── Order Item (1 baris Order All) ───

export interface OrderItem {
  id?: number
  storeId: string
  noPesanan: string
  statusPesanan: string
  waktuPesananDibuat: string
  ekspedisi?: string
  kota?: string
  sku: string
  skuNormalized: string
  namaProduk: string
  namaVariasi: string
  hargaAwal: number
  hargaSetelahDiskon: number
  qtyOrder: number
  qtyReturn: number
  qtyValid: number
  nilaiItemTotal: number
  hargaPerQty: number
  omzetValid: number
  omzetRetur: number
  hppPerSku: number | null
  hppValid: number
  hppRetur: number
  statusItem: "NORMAL" | "PARTIAL_RETURN" | "FULL_RETURN" | "BATAL"
  itemHash: string
  importDate: string
}

// ─── Order Header (1 per No. Pesanan) ───

export interface OrderHeader {
  id?: number
  storeId: string
  noPesanan: string
  statusPesanan: string
  waktuPesananDibuat: string
  waktuPembayaran: string
  metodePembayaran: string
  usernamePembeli: string
  ekspedisi?: string
  kota?: string
  totalQtyOrder: number
  totalQtyReturn: number
  totalQtyValid: number
  totalOmzetValid: number
  totalOmzetRetur: number
  totalHppValid: number
  totalHppRetur: number
  statusOrderFinal: "Selesai / Normal" | "Retur Sebagian" | "Retur Full" | "Batal"
  incomeAktual: number | null
  statusIncome: "Sudah Cocok" | "Belum Ada Income" | "Tidak Perlu Income" | "Belum Ada Income / Estimasi"
  totalPenyesuaian: number
  profitSebelumPenyesuaian: number
  profitSetelahPenyesuaian: number
  statusProfit: "Sudah Dihitung" | "Belum Ada Income" | "Tidak Dihitung" | "Belum Ada Income / Estimasi"
  statusHpp: "HPP Lengkap" | "HPP Sebagian" | "HPP Kosong" | "Tidak Perlu HPP / Batal"
  itemCount: number
  importDate: string
}

// ─── Income ───

export interface IncomeRecord {
  id?: number
  storeId: string
  noPesanan: string
  usernamePembeli: string
  waktuPesananDibuat: string
  metodePembayaran: string
  tanggalDanaDilepaskan: string
  hargaAsliProduk: number
  totalDiskonProduk: number
  pengembalianDana: number
  diskonDariShopee: number
  voucherPenjual: number
  ongkirDibayarPembeli: number
  gratisOngkirShopee: number
  biayaAdministrasi: number
  biayaLayanan: number
  biayaProsesPesanan: number
  biayaKomisiAms: number
  totalPenghasilan: number
  importDate: string
}

// ─── Adjustment ───

export interface AdjustmentRecord {
  id?: number
  storeId: string
  noPesananTerhubung: string
  tanggalAdjustment: string
  tipeAdjustment: string
  biayaPenyesuaian: number
  importDate: string
}

// ─── HPP SKU ───

export interface HppSku {
  id?: number
  storeId: string
  sku: string
  skuNormalized: string
  hpp: number
  namaProduk?: string
  updatedAt: string
}

// ─── HPP Resolver ───

export interface HppIssue {
  sku: string
  skuNormalized: string
  namaProduk: string
  orderCount: number
  qtyValidTerdampak: number
  omzetTerkait: number
  contohNoPesanan: string[]
}

// ─── Dashboard Summary ───

export interface DashboardSummary {
  totalOmzet: number
  totalHpp: number
  totalIncome: number
  totalProfit: number
  totalPenyesuaian: number
  totalOrder: number
  orderNormal: number
  orderReturSebagian: number
  orderReturFull: number
  orderBatal: number
  profitMargin: number
  hppLengkapCount: number
  hppSebagianCount: number
  hppKosongCount: number
  belumAdaIncome: number
}
