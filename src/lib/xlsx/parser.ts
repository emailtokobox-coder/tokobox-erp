/**
 * @module lib/xlsx/parser
 * SheetJS wrapper — reads Excel files, detects file type, maps columns to typed rows.
 * Column detection: Tier 1 (exact header match) → Tier 2 (fixed offsets per PRD).
 */

import * as XLSX from "xlsx";
import type {
  OrderAllRow,
  IncomeRow,
  AdjustmentRow,
  HppRow,
  GrosirRow,
  FileType,
  ParseResult,
  ParseError,
  ParseWarning,
  ColumnMap,
} from "./types";

/* ─── Helpers ─── */

/** Normalize header: lowercase, trim, collapse spaces */
function normalizeHeader(header: unknown): string {
  return String(header).toLowerCase().trim().replace(/\s+/g, " ");
}

/** Build column index map from header row (0-based) */
function buildColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach((h, i) => {
    map[normalizeHeader(h)] = i;
  });
  return map;
}

/** Resolve column index: Tier 1 exact match, Tier 2 fixed offset */
function resolveColumn(
  colMap: ColumnMap,
  fixedOffset: number,
  possibleNames: string[]
): number {
  for (const name of possibleNames) {
    if (colMap[normalizeHeader(name)] !== undefined) {
      return colMap[normalizeHeader(name)];
    }
  }
  return fixedOffset;
}

/** Read Excel buffer → workbook */
export function readExcelFile(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "array" });
}

/** Get sheet names from workbook */
export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}

/** Convert worksheet to 2D array */
function sheetToRows(worksheet: XLSX.WorkSheet): string[][] {
  const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });
  return data.map((row) => row.map((cell) => String(cell ?? "").trim()));
}

/**
 * Check if required columns are present.
 * Uses resolveColumn (Tier 1 exact match + Tier 2 fixed-offset fallback)
 * so columns found via fallback offset are NOT reported as missing.
 * A sentinel offset of -1 is used: if resolveColumn returns -1,
 * the column truly doesn't exist anywhere.
 */
function checkMissingHeaders(colMap: ColumnMap, required: string[]): string[] {
  return required.filter((name) => {
    const idx = resolveColumn(colMap, -1, [name]);
    return idx === -1;
  });
}

/**
 * Get raw cell value as string
 */
function getCell(row: string[], index: number): string {
  return row[index] ?? "";
}

/** Parse number from string, return 0 if invalid */
function parseNum(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/** Detect file type from sheet names + filename */
export function detectFileType(
  sheetNames: string[],
  fileName: string
): FileType {
  const name = fileName.toLowerCase();
  const sheets = sheetNames.map((s) => s.toLowerCase());

  if (sheets.includes("orders")) return "ORDER_ALL";
  if (sheets.includes("income")) return "INCOME";
  if (sheets.includes("adjustment")) return "ADJUSTMENT";

  if (name.includes("hpp") || name.includes("modal")) return "HPP";
  if (name.includes("grosir") || name.includes("wholesale")) return "GROSIR";

  return "UNKNOWN";
}

/* ─── Order All Parser (PRD 3.3) ─── */

const ORDER_ALL_REQUIRED_COLUMNS = [
  "no. pesanan",
  "status pesanan",
  "nomor referensi sku",
  "jumlah",
  "subtotal pesanan",
];

export function parseOrderAll(
  worksheet: XLSX.WorkSheet,
  fileName: string
): ParseResult<OrderAllRow> {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows = sheetToRows(worksheet);

  if (rows.length === 0) {
    return {
      data: [],
      errors: [{ row: 0, field: "file", message: "File Excel kosong" }],
      warnings: [],
      metadata: {
        fileName,
        fileType: "ORDER_ALL",
        sheetName: "orders",
        totalRows: 0,
        parsedRows: 0,
        skippedRows: 0,
        headers: [],
      },
    };
  }

  const headers = rows[0];
  const colMap = buildColumnMap(headers);
  const data: OrderAllRow[] = [];

/* Tier 1 header validation (Tier 2 fallback supported via resolveColumn) */
const missingHeaders = checkMissingHeaders(colMap, ORDER_ALL_REQUIRED_COLUMNS);
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      field: "headers",
      message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`,
    });
  }

  /* Column resolution (Tier 2 fallback to fixed offsets per PRD) */
  const noPesananIdx = resolveColumn(colMap, 0, ["no. pesanan"]);
  const statusPesananIdx = resolveColumn(colMap, 1, ["status pesanan"]);
  const statusPembatalanIdx = resolveColumn(colMap, 3, [
    "status pembatalan/ pengembalian",
    "status pembatalan/pengembalian",
  ]);
  const ekspedisiIdx = resolveColumn(colMap, 5, ["opsi pengiriman", "ekspedisi"]);
  const waktuDibuatIdx = resolveColumn(colMap, 9, ["waktu pesanan dibuat"]);
  const metodeBayarIdx = resolveColumn(colMap, 11, ["metode pembayaran"]);
  const namaProdukIdx = resolveColumn(colMap, 13, ["nama produk"]);
  const skuIdx = resolveColumn(colMap, 14, [
    "nomor referensi sku",
    "nomor referensi item",
    "sku",
  ]);
  const qtyOrderIdx = resolveColumn(colMap, 18, ["jumlah", "jumlah beli"]);
  const qtyReturnIdx = resolveColumn(colMap, 19, [
    "returned quantity",
    "return quantity",
    "return",
  ]);
  const omzetIdx = resolveColumn(colMap, 20, [
    "subtotal pesanan",
    "omzet item",
    "total harga",
  ]);
  const usernameIdx = resolveColumn(colMap, 42, ["username (pembeli)", "username pembeli"]);
  const kotaIdx = resolveColumn(colMap, 46, [
    "kota/kabupaten",
    "kota",
    "kabupaten",
  ]);
  const waktuSelesaiIdx = resolveColumn(colMap, 48, ["waktu pesanan selesai"]);

  /* Optional column detection */
  const skuIndukIdx = colMap["sku induk"];
  const namaVariasiIdx = colMap["nama variasi"];
  const hargaAwalIdx = colMap["harga awal"];
  const hargaDiskonIdx = colMap["harga setelah diskon"];
  const waktuBayarIdx = colMap["waktu pembayaran dilakukan"];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    /* Skip completely empty rows */
    if (row.every((cell) => cell === "")) continue;

    const qtyOrder = parseNum(getCell(row, qtyOrderIdx));
    const qtyReturnRaw = parseNum(getCell(row, qtyReturnIdx));
    const qtyReturn = Math.min(qtyReturnRaw, qtyOrder);

    const sku = getCell(row, skuIdx);
    if (!sku) {
      warnings.push({
        row: rowNum,
        field: "sku",
        message: "SKU kosong, baris dilewati",
      });
      continue;
    }

    data.push({
      noPesanan: getCell(row, noPesananIdx),
      statusPesanan: getCell(row, statusPesananIdx),
      statusPembatalanPengembalian: getCell(row, statusPembatalanIdx),
      ekspedisi: getCell(row, ekspedisiIdx),
      waktuPesananDibuat: getCell(row, waktuDibuatIdx),
      metodePembayaran: getCell(row, metodeBayarIdx),
      namaProduk: getCell(row, namaProdukIdx),
      sku,
      qtyOrder,
      qtyReturn,
      omzetItem: parseNum(getCell(row, omzetIdx)),
      usernamePembeli: getCell(row, usernameIdx),
      kotaKabupaten: getCell(row, kotaIdx),
      waktuPesananSelesai: getCell(row, waktuSelesaiIdx),
      ...(skuIndukIdx !== undefined && { skuInduk: getCell(row, skuIndukIdx) }),
      ...(namaVariasiIdx !== undefined && { namaVariasi: getCell(row, namaVariasiIdx) }),
      ...(hargaAwalIdx !== undefined && { hargaAwal: parseNum(getCell(row, hargaAwalIdx)) }),
      ...(hargaDiskonIdx !== undefined && {
        hargaSetelahDiskon: parseNum(getCell(row, hargaDiskonIdx)),
      }),
      ...(waktuBayarIdx !== undefined && { waktuPembayaranDilakukan: getCell(row, waktuBayarIdx) }),
    });
  }

  return {
    data,
    errors,
    warnings,
    metadata: {
      fileName,
      fileType: "ORDER_ALL",
      sheetName: "orders",
      totalRows: rows.length - 1,
      parsedRows: data.length,
      skippedRows: rows.length - 1 - data.length,
      headers,
    },
  };
}

/* ─── Income Parser (PRD 3.4) ─── */

const INCOME_REQUIRED_COLUMNS = [
 "no. pesanan",
 "total penghasilan",
 "pendapatan",
 "income",
 "total pendapatan",
 "pendapatan sebenarnya",
];

export function parseIncome(
 worksheet: XLSX.WorkSheet,
 fileName: string
): ParseResult<IncomeRow> {
 const errors: ParseError[] = [];
 const warnings: ParseWarning[] = [];
 const rows = sheetToRows(worksheet);

 if (rows.length < 6) {
  return {
   data: [],
   errors: [{ row: 0, field: "file", message: "File Income terlalu pendek" }],
   warnings: [],
   metadata: {
    fileName,
    fileType: "INCOME",
    sheetName: "Income",
    totalRows: 0,
    parsedRows: 0,
    skippedRows: 0,
    headers: [],
   },
  };
 }

 const headers = rows[5]; /* row 6 (0-based index 5) */
 const colMap = buildColumnMap(headers);
 const data: IncomeRow[] = [];

 let missingHeaders = checkMissingHeaders(colMap, INCOME_REQUIRED_COLUMNS);
 /* Fallback header patterns for Shopee income exports */
 if (missingHeaders.length > 0) {
  const altMap = buildColumnMap(headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "").trim()));
  const altColMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(altMap)) {
   altColMap[k] = headers[v] ?? "";
  }
  const relaxedMissing = missingHeaders.filter((name) => {
   const relaxed = name.replace(/[^a-z0-9]/g, "").trim();
   return !Object.values(altColMap).some((h) => h.replace(/[^a-z0-9]/g, "").trim().includes(relaxed));
  });
  if (relaxedMissing.length === 0) {
   missingHeaders = [];
  }
 }

 if (missingHeaders.length > 0) {
  errors.push({
   row: 6,
   field: "headers",
   message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}. Header terdeteksi: ${headers.slice(0, 10).join(", ")}${headers.length > 10 ? "..." : ""}`,
  });
 }

 const noPesananIdx = resolveColumn(colMap, 1, ["no. pesanan", "no pesanan", "no pesanann", "no.pesanan", "no_pesanan", "nomor pesanan"]);
 const noPengajuanIdx = resolveColumn(colMap, 2, ["no. pengajuan", "no pengajuan"]);
 const waktuDibuatIdx = resolveColumn(colMap, 4, ["waktu pesanan dibuat", "waktu dibuat", "tanggal pesanan"]);
 const metodeBayarIdx = resolveColumn(colMap, 5, ["metode pembayaran pembeli", "metode pembayaran", "payment method"]);
 const tanggalDanaIdx = resolveColumn(colMap, 6, ["tanggal dana dilepaskan", "tanggal dana", "release date"]);
 const hargaAsliIdx = resolveColumn(colMap, 7, ["harga asli produk", "harga asli", "original price"]);
 const diskonIdx = resolveColumn(colMap, 8, ["total diskon produk", "total diskon", "diskon"]);
 const refundIdx = resolveColumn(colMap, 9, ["jumlah pengembalian dana ke pembeli", "refund buyer", "pengembalian dana", "refund"]);
 const ongkirPembeliIdx = resolveColumn(colMap, 15, ["ongkir dibayar pembeli", "ongkos kirim dibayar pembeli", "shipping paid by buyer"]);
 const gratisOngkirIdx = resolveColumn(colMap, 17, ["gratis ongkir dari shopee", "gratis ongkir", "free shipping"]);
 const ongkirDiteruskanIdx = resolveColumn(colMap, 18, ["ongkir yang diteruskan oleh shopee ke jasa kirim", "ongkir diteruskan ke jasa kirim", "shipping fee forwarded"]);
 const ongkirPengembalianIdx = resolveColumn(colMap, 19, ["ongkos kirim pengembalian barang", "ongkir pengembalian", "return shipping"]);
 const komisiAmsIdx = resolveColumn(colMap, 22, ["biaya komisi ams", "komisi ams", "commission"]);
 const administrasiIdx = resolveColumn(colMap, 23, ["biaya administrasi", "administrasi", "admin fee"]);
 const layananIdx = resolveColumn(colMap, 24, ["biaya layanan", "biaya service", "service fee"]);
 const prosesPesananIdx = resolveColumn(colMap, 25, ["biaya proses pesanan", "biaya proses", "order processing fee"]);
 const incomeAktualIdx = resolveColumn(colMap, 30, ["total penghasilan", "total pendapatan", "pendapatan", "income", "pendapatan sebenarnya", "income aktual"]);

 for (let i = 6; i < rows.length; i++) {
  const row = rows[i];

  if (row.every((cell) => cell === "")) continue;

  data.push({
   noPesanan: getCell(row, noPesananIdx),
   noPengajuan: getCell(row, noPengajuanIdx),
   waktuPesananDibuat: getCell(row, waktuDibuatIdx),
   metodePembayaran: getCell(row, metodeBayarIdx),
   tanggalDanaDilepaskan: getCell(row, tanggalDanaIdx),
   hargaAsliProduk: parseNum(getCell(row, hargaAsliIdx)),
   totalDiskonProduk: parseNum(getCell(row, diskonIdx)),
   refundBuyer: parseNum(getCell(row, refundIdx)),
   ongkirDibayarPembeli: parseNum(getCell(row, ongkirPembeliIdx)),
   gratisOngkirShopee: parseNum(getCell(row, gratisOngkirIdx)),
   ongkirDiteruskanKeJasaKirim: parseNum(getCell(row, ongkirDiteruskanIdx)),
   ongkirPengembalian: parseNum(getCell(row, ongkirPengembalianIdx)),
   biayaKomisiAms: parseNum(getCell(row, komisiAmsIdx)),
   biayaAdministrasi: parseNum(getCell(row, administrasiIdx)),
   biayaLayanan: parseNum(getCell(row, layananIdx)),
   biayaProsesPesanan: parseNum(getCell(row, prosesPesananIdx)),
   incomeAktual: parseNum(getCell(row, incomeAktualIdx)),
  });
 }

 return {
  data,
  errors,
  warnings,
  metadata: {
   fileName,
   fileType: "INCOME",
   sheetName: "Income",
   totalRows: rows.length - 6,
   parsedRows: data.length,
   skippedRows: rows.length - 6 - data.length,
   headers,
  },
 };
}

/* ─── Adjustment Parser (PRD 3.5) ─── */

const ADJUSTMENT_REQUIRED_COLUMNS = [
  "no.",
  "tipe penyesuaian",
  "biaya penyesuaian",
];

export function parseAdjustment(
  worksheet: XLSX.WorkSheet,
  fileName: string
): ParseResult<AdjustmentRow> {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows = sheetToRows(worksheet);

  if (rows.length < 18) {
    return {
      data: [],
      errors: [{ row: 0, field: "file", message: "File Adjustment terlalu pendek" }],
      warnings: [],
      metadata: {
        fileName,
        fileType: "ADJUSTMENT",
        sheetName: "Adjustment",
        totalRows: 0,
        parsedRows: 0,
        skippedRows: 0,
        headers: [],
      },
    };
  }

  const headers = rows[17]; /* row 18 (0-based index 17) */
  const colMap = buildColumnMap(headers);
  const data: AdjustmentRow[] = [];

const missingHeaders = checkMissingHeaders(colMap, ADJUSTMENT_REQUIRED_COLUMNS);
if (missingHeaders.length > 0) {
  errors.push({
    row: 18,
    field: "headers",
      message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`,
    });
  }

  for (let i = 18; i < rows.length; i++) {
    const row = rows[i];

    if (row.every((cell) => cell === "")) continue;

    data.push({
      no: getCell(row, resolveColumn(colMap, 0, ["no."])),
      tanggalAdjustment: getCell(row, resolveColumn(colMap, 1, ["tanggal penyesuaian dibuat", "tanggal adjustment"])),
      tipeAdjustment: getCell(row, resolveColumn(colMap, 2, ["tipe penyesuaian", "tipe adjustment"])),
      alasanAdjustment: getCell(row, resolveColumn(colMap, 3, ["alasan penyesuaian", "alasan adjustment"])),
      biayaPenyesuaian: parseNum(getCell(row, resolveColumn(colMap, 4, ["biaya penyesuaian", "biaya adjustment"]))),
      noPesananTerhubung: getCell(row, resolveColumn(colMap, 5, ["no. pesanan terhubung", "no pesanan terhubung"])),
      tanggalDanaDilepaskan: getCell(row, resolveColumn(colMap, 6, ["tanggal dana dilepaskan"])),
    });
  }

  return {
    data,
    errors,
    warnings,
    metadata: {
      fileName,
      fileType: "ADJUSTMENT",
      sheetName: "Adjustment",
      totalRows: rows.length - 18,
      parsedRows: data.length,
      skippedRows: rows.length - 18 - data.length,
      headers,
    },
  };
}

/* ─── HPP Parser (PRD 3.6) ─── */

const HPP_REQUIRED_COLUMNS = ["sku", "hpp / modal", "modal", "hpp"];

export function parseHpp(
  worksheet: XLSX.WorkSheet,
  fileName: string
): ParseResult<HppRow> {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows = sheetToRows(worksheet);

  if (rows.length === 0) {
    return {
      data: [],
      errors: [{ row: 0, field: "file", message: "File HPP kosong" }],
      warnings: [],
      metadata: {
        fileName,
        fileType: "HPP",
        sheetName: "Sheet1",
        totalRows: 0,
        parsedRows: 0,
        skippedRows: 0,
        headers: [],
      },
    };
  }

  const headers = rows[0];
  const colMap = buildColumnMap(headers);
  const data: HppRow[] = [];

const missingHeaders = checkMissingHeaders(colMap, HPP_REQUIRED_COLUMNS);
if (missingHeaders.length > 0) {
  errors.push({
    row: 1,
    field: "headers",
    message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`,
  });
}

const skuIdx = resolveColumn(colMap, 0, ["sku"]);
  const hppIdx = resolveColumn(colMap, 1, ["hpp / modal", "modal", "hpp"]);
  const namaIdx = colMap["nama produk"];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    if (row.every((cell) => cell === "")) continue;

    const sku = getCell(row, skuIdx);
    if (!sku) {
      warnings.push({
        row: rowNum,
        field: "sku",
        message: "SKU kosong, baris dilewati",
      });
      continue;
    }

    const hppValue = parseNum(getCell(row, hppIdx));
    const entry: HppRow = { sku, hpp: hppValue };
    if (namaIdx !== undefined) {
      entry.namaProduk = getCell(row, namaIdx);
    }
    data.push(entry);
  }

  return {
    data,
    errors,
    warnings,
    metadata: {
      fileName,
      fileType: "HPP",
      sheetName: rows[0]?.[0] ? rows[0][0] : "Sheet1",
      totalRows: rows.length - 1,
      parsedRows: data.length,
      skippedRows: rows.length - 1 - data.length,
      headers,
    },
  };
}

/* ─── Grosir Parser (PRD 3.7) ─── */

const GROSIR_REQUIRED_COLUMNS = [
  "sku",
  "base harga",
  "min qty",
  "harga grosir",
  "mulai berlaku",
];

export function parseGrosir(
  worksheet: XLSX.WorkSheet,
  fileName: string
): ParseResult<GrosirRow> {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows = sheetToRows(worksheet);

  if (rows.length === 0) {
    return {
      data: [],
      errors: [{ row: 0, field: "file", message: "File Grosir kosong" }],
      warnings: [],
      metadata: {
        fileName,
        fileType: "GROSIR",
        sheetName: "Sheet1",
        totalRows: 0,
        parsedRows: 0,
        skippedRows: 0,
        headers: [],
      },
    };
  }

  const headers = rows[0];
  const colMap = buildColumnMap(headers);
  const data: GrosirRow[] = [];

  const missingHeaders = checkMissingHeaders(colMap, GROSIR_REQUIRED_COLUMNS);
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      field: "headers",
      message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`,
    });
  }

  const skuIdx = resolveColumn(colMap, 0, ["sku"]);
  const baseHargaIdx = resolveColumn(colMap, 1, ["base harga", "harga dasar"]);
  const minQtyIdx = resolveColumn(colMap, 2, ["min qty", "minimal qty"]);
  const hargaGrosirIdx = resolveColumn(colMap, 3, ["harga grosir"]);
  const mulaiBerlakuIdx = resolveColumn(colMap, 4, ["mulai berlaku"]);
  const berlakuSampaiIdx = colMap["berlaku sampai"];
  const catatanIdx = colMap["catatan"];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (row.every((cell) => cell === "")) continue;

    const entry: GrosirRow = {
      sku: getCell(row, skuIdx),
      baseHarga: parseNum(getCell(row, baseHargaIdx)),
      minQty: parseNum(getCell(row, minQtyIdx)),
      hargaGrosir: parseNum(getCell(row, hargaGrosirIdx)),
      mulaiBerlaku: getCell(row, mulaiBerlakuIdx),
    };
    if (berlakuSampaiIdx !== undefined) {
      entry.berlakuSampai = getCell(row, berlakuSampaiIdx);
    }
    if (catatanIdx !== undefined) {
      entry.catatan = getCell(row, catatanIdx);
    }
    data.push(entry);
  }

  return {
    data,
    errors,
    warnings,
    metadata: {
      fileName,
      fileType: "GROSIR",
      sheetName: rows[0]?.[0] ? rows[0][0] : "Sheet1",
      totalRows: rows.length - 1,
      parsedRows: data.length,
      skippedRows: rows.length - 1 - data.length,
      headers,
    },
  };
}
