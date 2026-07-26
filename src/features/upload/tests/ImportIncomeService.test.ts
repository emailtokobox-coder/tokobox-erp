/**
 * @module features/upload/tests/ImportIncomeService.test
 * Tests for ImportIncomeService — idempotency logic.
 *
 * Business logic per PRD Section 3.10.
 */

import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { ImportIncomeService } from "@/features/upload/services/ImportIncomeService";
import type { IncomeRow } from "@/features/upload/types";

/* ─── Helpers ─── */

/** Create a minimal in-memory Income.xlsx as ArrayBuffer.
 *  The parser expects headers at row 5 (0-indexed) and data from row 6 onward,
 *  with 5 metadata rows before the header (standard Shopee format).
 */
function createIncomeBuffer(
  rows: Array<{ noPesanan: string; incomeAktual: number; tanggalDanaDilepaskan: string }>
): ArrayBuffer {
  const headerRow = ["No. Pesanan", "Total Penghasilan", "Tanggal Dana Dilepaskan"];
  const dataRows = rows.map((r) => [r.noPesanan, String(r.incomeAktual), r.tanggalDanaDilepaskan]);

  // 5 metadata rows + header + data rows
  const allRows = [
    ["Laporan Income"],
    ["Toko: TokoBox"],
    ["Periode: 2025-01"],
    [""],
    [""],
    headerRow,
    ...dataRows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  worksheet["!sheetName"] = "income";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "income");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;
}

/* ─── ImportIncomeService ─── */

describe("ImportIncomeService", () => {
  it("parses income rows from buffer", () => {
    const buffer = createIncomeBuffer([
      { noPesanan: "ORD-1", incomeAktual: 300000, tanggalDanaDilepaskan: "2025-01-20" },
      { noPesanan: "ORD-2", incomeAktual: 150000, tanggalDanaDilepaskan: "2025-01-21" },
      { noPesanan: "ORD-3", incomeAktual: 200000, tanggalDanaDilepaskan: "2025-01-22" },
      { noPesanan: "ORD-4", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-23" },
      { noPesanan: "ORD-5", incomeAktual: 250000, tanggalDanaDilepaskan: "2025-01-24" },
    ]);

    const result = ImportIncomeService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.status).toBe("done");
    expect(result.data).toHaveLength(5);
    expect(result.data[0].noPesanan).toBe("ORD-1");
    expect(result.data[0].incomeAktual).toBe(300000);
    expect(result.data[0].tanggalDanaDilepaskan).toBe("2025-01-20");
  });

  it("skips rows that match existing income (same values)", () => {
    const buffer = createIncomeBuffer([
      { noPesanan: "ORD-1", incomeAktual: 300000, tanggalDanaDilepaskan: "2025-01-20" },
      { noPesanan: "ORD-2", incomeAktual: 150000, tanggalDanaDilepaskan: "2025-01-21" },
      { noPesanan: "ORD-3", incomeAktual: 200000, tanggalDanaDilepaskan: "2025-01-22" },
      { noPesanan: "ORD-4", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-23" },
      { noPesanan: "ORD-5", incomeAktual: 250000, tanggalDanaDilepaskan: "2025-01-24" },
    ]);

    // First import — all rows are new
    const first = ImportIncomeService.import(buffer);
    expect(first.data).toHaveLength(5);

    // Build existingIncome map from first result
    const existingIncome = new Map<string, IncomeRow>();
    for (const row of first.data) {
      existingIncome.set(row.noPesanan, row);
    }

    // Second import with same data — should skip all 5
    const second = ImportIncomeService.import(buffer, existingIncome);
    expect(second.data).toHaveLength(0);
    expect(second.warnings.length).toBe(5);
    expect(second.warnings[0]).toContain("Sudah ada, nilai sama");
  });

  it("keeps rows with different values and warns", () => {
    // First import
    const buffer1 = createIncomeBuffer([
      { noPesanan: "ORD-1", incomeAktual: 300000, tanggalDanaDilepaskan: "2025-01-20" },
      { noPesanan: "ORD-3", incomeAktual: 200000, tanggalDanaDilepaskan: "2025-01-22" },
      { noPesanan: "ORD-4", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-23" },
      { noPesanan: "ORD-5", incomeAktual: 250000, tanggalDanaDilepaskan: "2025-01-24" },
      { noPesanan: "ORD-6", incomeAktual: 120000, tanggalDanaDilepaskan: "2025-01-25" },
    ]);
    const first = ImportIncomeService.import(buffer1);
    const existingIncome = new Map<string, IncomeRow>();
    existingIncome.set(first.data[0].noPesanan, first.data[0]);

    // Second import with different value for ORD-1 + new row ORD-2
    const buffer2 = createIncomeBuffer([
      { noPesanan: "ORD-1", incomeAktual: 350000, tanggalDanaDilepaskan: "2025-01-20" },
      { noPesanan: "ORD-2", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-26" },
      { noPesanan: "ORD-3", incomeAktual: 200000, tanggalDanaDilepaskan: "2025-01-22" },
      { noPesanan: "ORD-4", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-23" },
      { noPesanan: "ORD-5", incomeAktual: 250000, tanggalDanaDilepaskan: "2025-01-24" },
    ]);
    const second = ImportIncomeService.import(buffer2, existingIncome);

    // ORD-1 (different, kept) + ORD-2 (new, kept) + ORD-3,4,5 (same, skipped)
    expect(second.data.length).toBeGreaterThanOrEqual(2);
    expect(second.warnings.some((w) => w.includes("nilai berbeda"))).toBe(true);
  });

  it("passes through new rows unchanged", () => {
    const buffer = createIncomeBuffer([
      { noPesanan: "ORD-1", incomeAktual: 300000, tanggalDanaDilepaskan: "2025-01-20" },
      { noPesanan: "ORD-2", incomeAktual: 150000, tanggalDanaDilepaskan: "2025-01-21" },
      { noPesanan: "ORD-3", incomeAktual: 200000, tanggalDanaDilepaskan: "2025-01-22" },
      { noPesanan: "ORD-4", incomeAktual: 100000, tanggalDanaDilepaskan: "2025-01-23" },
      { noPesanan: "ORD-5", incomeAktual: 250000, tanggalDanaDilepaskan: "2025-01-24" },
    ]);

    const result = ImportIncomeService.import(buffer, new Map());
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(5);
    expect(result.data[0].noPesanan).toBe("ORD-1");
    expect(result.data[0].incomeAktual).toBe(300000);
    expect(result.data[0].tanggalDanaDilepaskan).toBe("2025-01-20");
  });

  it("returns empty data for empty/no-data rows", () => {
    const allRows = [
      ["Laporan Income"],
      ["Toko: TokoBox"],
      ["Periode: 2025-01"],
      [""],
      [""],
      ["No. Pesanan", "Total Penghasilan", "Tanggal Dana Dilepaskan"],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(allRows);
    worksheet["!sheetName"] = "income";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "income");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;

    const result = ImportIncomeService.import(buffer);
    expect(result.data).toHaveLength(0);
    expect(result.summary.validRows).toBe(0);
  });
});
