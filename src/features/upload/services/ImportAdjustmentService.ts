/**
 * @module features/upload/services/ImportAdjustmentService
 * Import Adjustment service — orchestrates parse → validate → aggregate.
 * Business logic per PRD Section 3.11.
 */

import { readExcelFile, getSheetNames, detectFileType, parseAdjustment } from "@/lib/xlsx";
import type { AdjustmentRow, ImportResult } from "../types";

export class ImportAdjustmentService {
  /**
   * Import Adjustment Excel file.
   * Key: store_id + no_pesanan_terhubung + tanggal_adjustment + tipe_adjustment + biaya_penyesuaian
   * @param buffer - ArrayBuffer of the Excel file
   * @returns ImportResult with adjustment rows
   */
  static import(buffer: ArrayBuffer): ImportResult<AdjustmentRow> {
    const result: ImportResult<AdjustmentRow> = {
      success: false,
      status: "parsing",
      data: [],
      errors: [],
      warnings: [],
      summary: {
        totalRows: 0,
        parsedRows: 0,
        validRows: 0,
        errorRows: 0,
      },
    };

    try {
      const workbook = readExcelFile(buffer);
      const sheetNames = getSheetNames(workbook);
      const fileType = detectFileType(sheetNames, "Adjustment.xlsx");

      if (fileType !== "ADJUSTMENT") {
        result.errors.push(`File tidak terdeteksi sebagai Adjustment. Sheet: ${sheetNames.join(", ")}`);
        result.status = "error";
        return result;
      }

      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result;
      }

      const parseResult = parseAdjustment(worksheet, "Adjustment.xlsx");
      result.summary.totalRows = parseResult.metadata.totalRows;
      result.summary.parsedRows = parseResult.metadata.parsedRows;

      for (const err of parseResult.errors) {
        result.errors.push(`[Baris ${err.row}] ${err.field}: ${err.message}`);
      }
      for (const warn of parseResult.warnings) {
        result.warnings.push(`[Baris ${warn.row}] ${warn.field}: ${warn.message}`);
      }

      result.data = parseResult.data;
      result.summary.validRows = parseResult.data.length;
      result.summary.errorRows = result.summary.totalRows - result.summary.validRows;
      result.success = result.errors.length === 0;
      result.status = result.success ? "done" : "error";

      return result;
    } catch (err) {
      result.errors.push(`Error parsing file: ${err instanceof Error ? err.message : "Unknown error"}`);
      result.status = "error";
      return result;
    }
  }
}
