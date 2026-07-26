/**
 * @module features/upload/services/ImportIncomeService
 * Import Income service — orchestrates parse → validate → idempotency check.
 * Business logic per PRD Section 3.10.
 */

import { readExcelFile, getSheetNames, detectFileType, parseIncome } from "@/lib/xlsx";
import type { IncomeRow, ImportResult } from "../types";

export class ImportIncomeService {
  /**
   * Import Income Excel file.
   * Idempotency: if noPesanan already exists with same values → skip.
   * @param buffer - ArrayBuffer of the Excel file
   * @param existingIncome - Map of noPesanan → existing income data (for idempotency check)
   * @returns ImportResult with income rows
   */
  static import(
    buffer: ArrayBuffer,
    existingIncome: Map<string, IncomeRow> = new Map()
  ): ImportResult<IncomeRow> {
    const result: ImportResult<IncomeRow> = {
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
      const fileType = detectFileType(sheetNames, "Income.xlsx");

      if (fileType !== "INCOME") {
        result.errors.push(`File tidak terdeteksi sebagai Income. Sheet: ${sheetNames.join(", ")}`);
        result.status = "error";
        return result;
      }

      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result;
      }

      const parseResult = parseIncome(worksheet, "Income.xlsx");
      result.summary.totalRows = parseResult.metadata.totalRows;
      result.summary.parsedRows = parseResult.metadata.parsedRows;

      for (const err of parseResult.errors) {
        result.errors.push(`[Baris ${err.row}] ${err.field}: ${err.message}`);
      }
      for (const warn of parseResult.warnings) {
        result.warnings.push(`[Baris ${warn.row}] ${warn.field}: ${warn.message}`);
      }

      /* Idempotency check (PRD 3.10 rules 2-4) */
      const newData: IncomeRow[] = [];
      for (const row of parseResult.data) {
        const existing = existingIncome.get(row.noPesanan);
        if (existing) {
          /* Same values → skip */
          if (
            existing.incomeAktual === row.incomeAktual &&
            existing.tanggalDanaDilepaskan === row.tanggalDanaDilepaskan
          ) {
            result.warnings.push(`[${row.noPesanan}] Sudah ada, nilai sama — diabaikan`);
            continue;
          }
          /* Different values → would update (in Phase 5 with DB) */
          result.warnings.push(`[${row.noPesanan}] Sudah ada, nilai berbeda — akan diupdate`);
        }
        newData.push(row);
      }

      result.data = newData;
      result.summary.validRows = newData.length;
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
