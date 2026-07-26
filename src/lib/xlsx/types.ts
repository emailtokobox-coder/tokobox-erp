/**
 * @module lib/xlsx
 * XLSX parsing types — maps Shopee Excel columns to domain objects.
 * Based on PRD Section 3.3–3.7 (SHOPEE_LOGIC_CONTRACT).
 */

/* ─── File Type Detection ─── */

export type FileType = "ORDER_ALL" | "INCOME" | "ADJUSTMENT" | "HPP" | "GROSIR" | "UNKNOWN";

/* ─── Order All (PRD 3.3) ─── */

export interface OrderAllRow {
  noPesanan: string;
  statusPesanan: string;
  statusPembatalanPengembalian: string;
  ekspedisi: string;
  waktuPesananDibuat: string;
  metodePembayaran: string;
  namaProduk: string;
  sku: string;
  qtyOrder: number;
  qtyReturn: number;
  omzetItem: number;
  usernamePembeli: string;
  kotaKabupaten: string;
  waktuPesananSelesai: string;

  /* optional columns (detected dynamically) */
  skuInduk?: string;
  namaVariasi?: string;
  hargaAwal?: number;
  hargaSetelahDiskon?: number;
  waktuPembayaranDilakukan?: string;
}

/* ─── Income (PRD 3.4) ─── */

export interface IncomeRow {
  noPesanan: string;
  noPengajuan: string;
  waktuPesananDibuat: string;
  metodePembayaran: string;
  tanggalDanaDilepaskan: string;
  hargaAsliProduk: number;
  totalDiskonProduk: number;
  refundBuyer: number;
  ongkirDibayarPembeli: number;
  gratisOngkirShopee: number;
  ongkirDiteruskanKeJasaKirim: number;
  ongkirPengembalian: number;
  biayaKomisiAms: number;
  biayaAdministrasi: number;
  biayaLayanan: number;
  biayaProsesPesanan: number;
  incomeAktual: number;
}

/* ─── Adjustment (PRD 3.5) ─── */

export interface AdjustmentRow {
  no: string;
  tanggalAdjustment: string;
  tipeAdjustment: string;
  alasanAdjustment: string;
  biayaPenyesuaian: number;
  noPesananTerhubung: string;
  tanggalDanaDilepaskan: string;
}

/* ─── HPP (PRD 3.6) ─── */

export interface HppRow {
  sku: string;
  hpp: number;
  namaProduk?: string;
}

/* ─── Grosir (PRD 3.7) ─── */

export interface GrosirRow {
  sku: string;
  baseHarga: number;
  minQty: number;
  hargaGrosir: number;
  mulaiBerlaku: string;
  berlakuSampai?: string;
  catatan?: string;
}

/* ─── Parse Result ─── */

export interface ParseError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ParseWarning {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  warnings: ParseWarning[];
  metadata: {
    fileName: string;
    fileType: FileType;
    sheetName: string;
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
    headers: string[];
  };
}

/* ─── Column Index Map (for fixed-offset fallback) ─── */

export interface ColumnMap {
  [key: string]: number;
}
