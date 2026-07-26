/**
 * @module features/upload/tests/ImportHppService.test
 * Tests for ImportHppService — hppMap building.
 *
 * Business logic per PRD Section 3.12.
 */

import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { ImportHppService } from "@/features/upload/services/ImportHppService";

/* ─── Helpers ─── */

/** Create a minimal in-memory HPP.xlsx as ArrayBuffer.
 *  HPP_REQUIRED_COLUMNS requires: sku, hpp / modal, modal, hpp
 */
function createHppBuffer(rows: Array<{ sku: string; hpp: number; namaProduk?: string }>): ArrayBuffer {
  const data = rows.map((r) => ({
    SKU: r.sku,
    "HPP / Modal": r.hpp,
    Modal: r.hpp,       // alternate column name required by parser
    HPP: r.hpp,         // alternate column name required by parser
    "Nama Produk": r.namaProduk ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!sheetName"] = "hpp";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "hpp");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;
}

/* ─── ImportHppService ─── */

describe("ImportHppService", () => {
  it("builds hppMap from a single SKU", () => {
    const buffer = createHppBuffer([
      { sku: "LBM-100", hpp: 50000, namaProduk: "Lemari" },
    ]);

    const result = ImportHppService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].sku).toBe("LBM-100");
    expect(result.data[0].hpp).toBe(50000);
    expect(result.hppMap.get("lbm-100")).toBe(50000);
  });

  it("builds hppMap from multiple SKUs", () => {
    const buffer = createHppBuffer([
      { sku: "LBM-100", hpp: 50000 },
      { sku: "RKS-50", hpp: 25000 },
      { sku: "MJR-200", hpp: 80000 },
    ]);

    const result = ImportHppService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.hppMap.get("lbm-100")).toBe(50000);
    expect(result.hppMap.get("rks-50")).toBe(25000);
    expect(result.hppMap.get("mjr-200")).toBe(80000);
  });

  it("normalizes SKU to lowercase trimmed", () => {
    const buffer = createHppBuffer([
      { sku: "  LBM-100  ", hpp: 50000 },
      { sku: "Rks-50", hpp: 25000 },
    ]);

    const result = ImportHppService.import(buffer);
    expect(result.hppMap.has("lbm-100")).toBe(true);
    expect(result.hppMap.has("  lbm-100  ")).toBe(false);
    expect(result.hppMap.get("rks-50")).toBe(25000);
  });

  it("overwrites duplicate SKU with last occurrence", () => {
    const buffer = createHppBuffer([
      { sku: "LBM-100", hpp: 50000 },
      { sku: "LBM-100", hpp: 60000 },
    ]);

    const result = ImportHppService.import(buffer);
    expect(result.data).toHaveLength(2);
    expect(result.hppMap.get("lbm-100")).toBe(60000);
  });

  it("returns empty hppMap for empty file", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["SKU", "HPP / Modal", "Modal", "HPP"],
    ]);
    worksheet["!sheetName"] = "hpp";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "hpp");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;

    const result = ImportHppService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.hppMap.size).toBe(0);
  });

  it("returns hppMap with correct size for multiple SKUs", () => {
    const buffer = createHppBuffer([
      { sku: "LBM-100", hpp: 50000 },
      { sku: "RKS-50", hpp: 25000 },
    ]);

    const result = ImportHppService.import(buffer);
    expect(result.hppMap.size).toBe(2);
  });
});
