/**
 * @module features/upload/services/ImportHppService
 * Import HPP service — orchestrates parse → validate → build HPP map.
 * Business logic per PRD Section 3.12.
 */

import { readExcelFile, getSheetNames, parseHpp } from "@/lib/xlsx";
import type { HppRow, ImportResult } from "../types";

export class ImportHppService {
  /**
   * Import HPP Excel file.
   * Key: store_id + sku_normalized (compound unique)
   * @param buffer - ArrayBuffer of the Excel file
   * @returns ImportResult with HPP rows + a Map<sku, hpp>
   */
  static import(buffer: ArrayBuffer): ImportResult<HppRow> & { hppMap: Map<string, number> } {
    const result: ImportResult<HppRow> & { hppMap: Map<string, number> } = {
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
      hppMap: new Map(),
    };

    try {
      const workbook = readExcelFile(buffer);
      const sheetNames = getSheetNames(workbook);

      /* HPP detected by filename pattern */
      const fileName = sheetNames[0]?.toLowerCase().includes("hpp") ? "hpp.xlsx" : "custom.xlsx";
      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result;
      }

      const parseResult = parseHpp(worksheet, fileName);
      result.summary.totalRows = parseResult.metadata.totalRows;
      result.summary.parsedRows = parseResult.metadata.parsedRows;

      for (const err of parseResult.errors) {
        result.errors.push(`[Baris ${err.row}] ${err.field}: ${err.message}`);
      }
      for (const warn of parseResult.warnings) {
        result.warnings.push(`[Baris ${warn.row}] ${warn.field}: ${warn.message}`);
      }

      /* Build SKU → HPP map */
      const hppMap = new Map<string, number>();
      for (const row of parseResult.data) {
        const skuNormalized = row.sku.toLowerCase().trim();
        hppMap.set(skuNormalized, row.hpp);
      }
      result.hppMap = hppMap;

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
