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
   * If values differ, mark for UPDATE instead of INSERT.
   * Business logic per PRD Section 3.10.
   */
  static import(
    buffer: ArrayBuffer,
    existingIncome: Map<string, IncomeRow> = new Map()
  ): ImportResult<IncomeRow> & { toUpdate: Array<{ old: IncomeRow; new: IncomeRow }> } {
    const result: Omit<ImportResult<IncomeRow>, "data"> & {
      data: IncomeRow[];
      toUpdate: Array<{ old: IncomeRow; new: IncomeRow }>;
    } = {
      success: false,
      status: "parsing",
      data: [],
      toUpdate: [],
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
        return result as any;
      }

      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result as any;
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
      const toUpdate: Array<{ old: IncomeRow; new: IncomeRow }> = [];

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
          /* Different values → mark for UPDATE instead of INSERT */
          result.warnings.push(`[${row.noPesanan}] Sudah ada, nilai berbeda — akan diupdate`);
          toUpdate.push({ old: existing, new: row });
        } else {
          newData.push(row);
        }
      }

      result.data = newData;
      result.toUpdate = toUpdate;
      result.summary.validRows = newData.length + toUpdate.length;
      result.summary.errorRows = result.summary.totalRows - result.summary.validRows;
      result.success = result.errors.length === 0;
      result.status = result.success ? "done" : "error";

      return result as any;
    } catch (err) {
      result.errors.push(`Error parsing file: ${err instanceof Error ? err.message : "Unknown error"}`);
      result.status = "error";
      return result as any;
    }
  }
}
