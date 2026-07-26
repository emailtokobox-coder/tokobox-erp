/**
 * @module features/upload/types
 * Shared types for the upload feature — import results, status tracking.
 */

export type { OrderAllRow, IncomeRow, AdjustmentRow, HppRow, GrosirRow } from "@/lib/xlsx";

/* ─── Import Status ─── */

export type ImportStatus = "pending" | "parsing" | "validating" | "processing" | "done" | "error";

/* ─── File Type Info ─── */

export interface FileTypeInfo {
  type: "ORDER_ALL" | "INCOME" | "ADJUSTMENT" | "HPP" | "GROSIR" | "UNKNOWN";
  label: string;
  description: string;
}

export const FILE_TYPE_INFO: Record<string, FileTypeInfo> = {
  ORDER_ALL: {
    type: "ORDER_ALL",
    label: "Order All",
    description: "Daftar semua pesanan dari Shopee",
  },
  INCOME: {
    type: "INCOME",
    label: "Income",
    description: "Data income / dana dilepaskan",
  },
  ADJUSTMENT: {
    type: "ADJUSTMENT",
    label: "Adjustment",
    description: "Data penyesuaian biaya",
  },
  HPP: {
    type: "HPP",
    label: "HPP",
    description: "Harga pokok penjualan per SKU",
  },
  GROSIR: {
    type: "GROSIR",
    label: "Harga Grosir",
    description: "Harga grosir per SKU",
  },
  UNKNOWN: {
    type: "UNKNOWN",
    label: "Tidak Dikenal",
    description: "Format file tidak dikenali",
  },
};

/* ─── Import Result ─── */

export interface ImportResult<T> {
  success: boolean;
  status: ImportStatus;
  data: T[];
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    parsedRows: number;
    validRows: number;
    errorRows: number;
  };
}

/* ─── Order Import Result (with business logic applied) ─── */

export interface OrderItemProcessed {
  noPesanan: string;
  sku: string;
  namaProduk: string;
  namaVariasi?: string;
  qtyOrder: number;
  qtyReturn: number;
  qtyValid: number;
  hargaPerQty: number;
  omzetValid: number;
  omzetRetur: number;
  hppValid: number;
  hppRetur: number;
  statusItem: "NORMAL" | "PARTIAL_RETURN" | "FULL_RETURN" | "BATAL";
  itemHash: string;
  /** Waktu pesanan dibuat (from Order All Excel) — used for stock history date */
  waktuPesananDibuat?: string;
}

export interface OrderHeaderProcessed {
  noPesanan: string;
  storeId: string;
  totalQtyOrder: number;
  totalQtyReturn: number;
  totalQtyValid: number;
  totalOmzetValid: number;
  totalOmzetRetur: number;
  totalHppValid: number;
  totalHppRetur: number;
  statusOrderFinal: "Selesai / Normal" | "Retur Sebagian" | "Retur Full" | "Batal";
  statusHpp: "HPP Lengkap" | "HPP Sebagian" | "HPP Kosong" | "Tidak Perlu HPP / Batal";
  statusIncome: string;
  statusProfit: string;
  waktuPesananDibuat?: string;
}
