/**
 * @module lib/xlsx/validator
 * Validation logic for parsed Excel data — file type, columns, rows, required fields.
 */

import type { FileType, ParseResult, ParseError } from "./types";

/* ─── File Type Validation ─── */

export function validateFileType(
  sheetNames: string[],
  fileName: string,
  expectedType: FileType
): ParseError[] {
  const errors: ParseError[] = [];
  const name = fileName.toLowerCase();
  const sheets = sheetNames.map((s) => s.toLowerCase());

  if (expectedType === "ORDER_ALL" && !sheets.includes("orders")) {
    errors.push({
      row: 0,
      field: "sheet",
      message: `File Order All harus memiliki sheet "orders". Sheet ditemukan: ${sheetNames.join(", ")}`,
    });
  }

  if (expectedType === "INCOME" && !sheets.includes("income")) {
    errors.push({
      row: 0,
      field: "sheet",
      message: `File Income harus memiliki sheet "Income". Sheet ditemukan: ${sheetNames.join(", ")}`,
    });
  }

  if (expectedType === "ADJUSTMENT" && !sheets.includes("adjustment")) {
    errors.push({
      row: 0,
      field: "sheet",
      message: `File Adjustment harus memiliki sheet "Adjustment". Sheet ditemukan: ${sheetNames.join(", ")}`,
    });
  }

  /* Filename pattern check */
  if (expectedType === "ORDER_ALL" && !name.includes("order")) {
    errors.push({
      row: 0,
      field: "filename",
      message: `Nama file tidak terdeteksi sebagai Order All. Harus mengandung "order". Ditemukan: ${fileName}`,
    });
  }

  if (expectedType === "INCOME" && !name.includes("income")) {
    errors.push({
      row: 0,
      field: "filename",
      message: `Nama file tidak terdeteksi sebagai Income. Harus mengandung "income". Ditemukan: ${fileName}`,
    });
  }

  return errors;
}

/* ─── Column Validation ─── */

export function validateRequiredColumns(
  headers: string[],
  required: string[]
): ParseError[] {
  const errors: ParseError[] = [];
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const col of required) {
    const found = normalizedHeaders.some((h) => h === col.toLowerCase().trim());
    if (!found) {
      errors.push({
        row: 1,
        field: "column",
        message: `Kolom wajib "${col}" tidak ditemukan di header. Header tersedia: ${headers.join(", ")}`,
      });
    }
  }

  return errors;
}

/* ─── Row Count Validation ─── */

export function validateRowCount(
  rowCount: number,
  min: number,
  max: number,
  label: string
): ParseError[] {
  const errors: ParseError[] = [];

  if (rowCount < min) {
    errors.push({
      row: 0,
      field: "rowCount",
      message: `${label}: terlalu sedikit data (${rowCount} baris, minimum ${min})`,
    });
  }

  if (rowCount > max) {
    errors.push({
      row: 0,
      field: "rowCount",
      message: `${label}: terlalu banyak data (${rowCount} baris, maximum ${max}). Periksa apakah file benar.`,
    });
  }

  return errors;
}

/* ─── Required Field Validation ─── */

export function validateNoEmptyRequiredFields(
  data: unknown[],
  fields: string[],
  label: string
): ParseError[] {
  const errors: ParseError[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>;
    for (const field of fields) {
      const value = item[field];
      if (value === null || value === undefined || value === "") {
        errors.push({
          row: i + 1,
          field: String(field),
          message: `${label} baris ${i + 1}: kolom "${String(field)}" kosong`,
        });
      }
    }
  }

  return errors;
}

/* ─── Full Validation Pipeline ─── */

export function validateParseResult<T>(
  result: ParseResult<T>,
  expectedType: FileType,
  requiredColumns: string[],
  requiredFields: (keyof T)[],
  rowRange: { min: number; max: number },
  label: string
): ParseError[] {
  const allErrors: ParseError[] = [];

  /* 1. File type validation */
  allErrors.push(...validateFileType([result.metadata.sheetName], result.metadata.fileName, expectedType));

  /* 2. Column validation */
  allErrors.push(...validateRequiredColumns(result.metadata.headers, requiredColumns));

  /* 3. Row count validation */
  allErrors.push(...validateRowCount(result.metadata.totalRows, rowRange.min, rowRange.max, label));

  /* 4. Required field validation */
  allErrors.push(...validateNoEmptyRequiredFields(result.data, requiredFields as string[], label));

  return allErrors;
}
