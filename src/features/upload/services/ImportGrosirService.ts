/**
 * @module features/upload/services/ImportGrosirService
 * Import Grosir service — orchestrates parse → validate → build grosir map.
 * Business logic per PRD Section 3.7.
 */

import { readExcelFile, getSheetNames, parseGrosir } from "@/lib/xlsx";
import type { GrosirRow, ImportResult } from "../types";

export class ImportGrosirService {
  /**
   * Import Grosir Excel file.
   * @param buffer - ArrayBuffer of the Excel file
   * @returns ImportResult with grosir rows + a Map<sku, GrosirRow[]>
   */
  static import(buffer: ArrayBuffer): ImportResult<GrosirRow> & { grosirMap: Map<string, GrosirRow[]> } {
    const result: ImportResult<GrosirRow> & { grosirMap: Map<string, GrosirRow[]> } = {
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
      grosirMap: new Map(),
    };

    try {
      const workbook = readExcelFile(buffer);
      const sheetNames = getSheetNames(workbook);
      const fileName = sheetNames[0]?.toLowerCase().includes("grosir") ? "grosir.xlsx" : "custom.xlsx";
      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result;
      }

      const parseResult = parseGrosir(worksheet, fileName);
      result.summary.totalRows = parseResult.metadata.totalRows;
      result.summary.parsedRows = parseResult.metadata.parsedRows;

      for (const err of parseResult.errors) {
        result.errors.push(`[Baris ${err.row}] ${err.field}: ${err.message}`);
      }
      for (const warn of parseResult.warnings) {
        result.warnings.push(`[Baris ${warn.row}] ${warn.field}: ${warn.message}`);
      }

      /* Build SKU → GrosirRow[] map (multiple tiers per SKU) */
      const grosirMap = new Map<string, GrosirRow[]>();
      for (const row of parseResult.data) {
        const skuNormalized = row.sku.toLowerCase().trim();
        const existing = grosirMap.get(skuNormalized) ?? [];
        existing.push(row);
        grosirMap.set(skuNormalized, existing);
      }
      result.grosirMap = grosirMap;

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
