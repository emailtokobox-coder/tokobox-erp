/**
 * @module features/upload/actions/getPreviewAction
 * Preview Server Action — validates file type, parses Excel, returns preview data.
 *
 * Per PRD 7.3 + 9.7: preview before import shows headers, 5 sample rows,
 * row count, and errors/warnings WITHOUT writing to the database.
 *
 * Flow:
 *   UI → getPreviewAction → XLSX Parser → PreviewResult (no DB write)
 */

import {
  readExcelFile,
  getSheetNames,
  detectFileType,
  parseOrderAll,
  parseIncome,
  parseAdjustment,
  parseHpp,
  parseGrosir,
} from "@/lib/xlsx";
import type { ParseResult } from "@/lib/xlsx";

/* ─── Per-File Preview Result ─── */

export interface FilePreview {
  fileType: "ORDER_ALL" | "INCOME" | "ADJUSTMENT" | "HPP" | "GROSIR" | "UNKNOWN";
  fileName: string;
  /** Column headers found in the file */
  headers: string[];
  /** First 5 data rows as plain objects */
  sampleRows: Record<string, unknown>[];
  totalRows: number;
  parsedRows: number;
  errorRows: number;
  errors: string[];
  warnings: string[];
  /** Whether file type matches the upload slot */
  typeMatch: boolean;
  /** Human-readable type detection message per PRD 3.15 */
  typeMessage: string;
}

/* ─── Full Preview Result (all files) ─── */

export interface PreviewResult {
  success: boolean;
  files: {
    order?: FilePreview;
    income?: FilePreview;
    adjustment?: FilePreview;
    hpp?: FilePreview;
    grosir?: FilePreview;
  };
  /** Aggregate errors across all files */
  errors: string[];
}

/* ─── Slot → Expected Type Mapping ─── */

const SLOT_TYPE_MAP: Record<string, string> = {
  orderFile: "ORDER_ALL",
  incomeFile: "INCOME",
  adjustmentFile: "ADJUSTMENT",
  hppFile: "HPP",
  grosirFile: "GROSIR",
};

const TYPE_LABELS: Record<string, string> = {
  ORDER_ALL: "Order All",
  INCOME: "Income",
  ADJUSTMENT: "Adjustment",
  HPP: "HPP",
  GROSIR: "Harga Grosir",
  UNKNOWN: "Tidak Dikenal",
};

/* ─── Helpers ─── */

function checkTypeMatch(
  detectedType: string,
  slotKey: string
): { match: boolean; message: string } {
  const expectedType = SLOT_TYPE_MAP[slotKey];
  if (!expectedType) {
    return {
      match: true,
      message: `File terdeteksi sebagai ${TYPE_LABELS[detectedType] || detectedType}`,
    };
  }

  if (detectedType === expectedType) {
    return {
      match: true,
      message: `File sesuai slot ${TYPE_LABELS[expectedType]}`,
    };
  }

  if (detectedType === "UNKNOWN") {
    return {
      match: false,
      message: `⚠ File tidak dikenali untuk slot ${TYPE_LABELS[expectedType]}. Pastikan file yang diupload benar.`,
    };
  }

  return {
    match: false,
    message: `File ini terdeteksi sebagai ${TYPE_LABELS[detectedType]}, bukan ${TYPE_LABELS[expectedType]}.`,
  };
}

/**
 * Parse a single file buffer and return preview data.
 * No DB writes — purely read/parse.
 */
function parseFileForPreview(
  buffer: ArrayBuffer,
  fileName: string,
  slotKey: string
): FilePreview {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const workbook = readExcelFile(buffer);
    const sheetNames = getSheetNames(workbook);
    const detectedType = detectFileType(sheetNames, fileName);
    const typeCheck = checkTypeMatch(detectedType, slotKey);

    let headers: string[] = [];
    let sampleRows: Record<string, unknown>[] = [];
    let totalRows = 0;
    let parsedRows = 0;

    try {
      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        errors.push("Sheet tidak ditemukan dalam file");
} else {
  let parseResult: ParseResult<unknown> | null = null;

        switch (detectedType) {
          case "ORDER_ALL":
            parseResult = parseOrderAll(worksheet, fileName);
            break;
          case "INCOME":
            parseResult = parseIncome(worksheet, fileName);
            break;
          case "ADJUSTMENT":
            parseResult = parseAdjustment(worksheet, fileName);
            break;
          case "HPP":
            parseResult = parseHpp(worksheet, fileName);
            break;
          case "GROSIR":
            parseResult = parseGrosir(worksheet, fileName);
            break;
        }

  if (parseResult) {
    headers = parseResult.metadata.headers;
    sampleRows = parseResult.data.slice(0, 5).map((row) => {
            const obj: Record<string, unknown> = {};
            for (const key of Object.keys(row as Record<string, unknown>)) {
              obj[key] = (row as Record<string, unknown>)[key];
            }
            return obj;
          });
          totalRows = parseResult.metadata.totalRows;
          parsedRows = parseResult.metadata.parsedRows;
          errors.push(...parseResult.errors.map((e) => `Baris ${e.row}: ${e.field} — ${e.message}`));
          warnings.push(...parseResult.warnings.map((w) => `Baris ${w.row}: ${w.field} — ${w.message}`));
        }
      }
    } catch (parseErr) {
      errors.push(`Error parsing: ${parseErr instanceof Error ? parseErr.message : "Unknown"}`);
    }

    if (!typeCheck.match) {
      errors.unshift(typeCheck.message);
    } else if (typeCheck.message) {
      warnings.unshift(typeCheck.message);
    }

    return {
      fileType: detectedType,
      fileName,
      headers,
      sampleRows,
      totalRows,
      parsedRows,
      errorRows: totalRows - parsedRows,
      errors,
      warnings,
      typeMatch: typeCheck.match,
      typeMessage: typeCheck.message,
    };
  } catch (err) {
    return {
      fileType: "UNKNOWN",
      fileName,
      headers: [],
      sampleRows: [],
      totalRows: 0,
      parsedRows: 0,
      errorRows: 0,
      errors: [
        err instanceof Error
          ? `Gagal membaca file: ${err.message}`
          : "Gagal membaca file. Pastikan file Excel tidak rusak.",
      ],
      warnings: [],
      typeMatch: false,
      typeMessage: "",
    };
  }
}

/* ─── Server Action ─── */

/**
 * Preview uploaded Excel files before import.
 * Parses files and returns preview data WITHOUT writing to the database.
 *
 * @param formData - FormData containing optional files:
 *   - orderFile: File (Order All)
 *   - incomeFile: File (Income)
 *   - adjustmentFile: File (Adjustment)
 *   - hppFile: File (HPP)
 *   - grosirFile: File (Grosir)
 *   Each file can also have a slotKey field for type validation
 * @returns PreviewResult with parsed preview data per file
 */
export async function getPreviewAction(
  formData: FormData
): Promise<PreviewResult> {
  const aggregateErrors: string[] = [];
  const files: PreviewResult["files"] = {};

  /* ─── File slot configurations ─── */

  const slotConfigs: { key: string; fieldName: string }[] = [
    { key: "orderFile", fieldName: "orderFile" },
    { key: "incomeFile", fieldName: "incomeFile" },
    { key: "adjustmentFile", fieldName: "adjustmentFile" },
    { key: "hppFile", fieldName: "hppFile" },
    { key: "grosirFile", fieldName: "grosirFile" },
  ];

  for (const config of slotConfigs) {
    const file = formData.get(config.fieldName);
    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      const preview = parseFileForPreview(buffer, file.name, config.key);
      const key = config.key.replace("File", "") as keyof PreviewResult["files"];

      if (preview.errors.length > 0) {
        aggregateErrors.push(...preview.errors.map((e) => `[${TYPE_LABELS[preview.fileType] || preview.fileType}] ${e}`));
      }

      (files as Record<string, FilePreview>)[key] = preview;
    }
  }

  const hasAnyData = Object.values(files).some(
    (f) => f && f.parsedRows > 0
  );

  return {
    success: aggregateErrors.length === 0 && hasAnyData,
    files,
    errors: aggregateErrors,
  };
}
