/**
 * @module features/upload/tests/ImportGrosirService.test
 * Tests for ImportGrosirService — grosirMap building.
 *
 * Business logic per PRD Section 3.7.
 */

import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { ImportGrosirService } from "@/features/upload/services/ImportGrosirService";

/* ─── Helpers ─── */

/** Create a minimal in-memory Grosir.xlsx as ArrayBuffer */
function createGrosirBuffer(rows: Array<{ sku: string; baseHarga: number; minQty: number; hargaGrosir: number; mulaiBerlaku: string; berlakuSampai?: string; catatan?: string }>): ArrayBuffer {
  const data = rows.map((r) => ({
    SKU: r.sku,
    "Base Harga": r.baseHarga,
    "Min Qty": r.minQty,
    "Harga Grosir": r.hargaGrosir,
    "Mulai Berlaku": r.mulaiBerlaku,
    "Berlaku Sampai": r.berlakuSampai ?? "",
    Catatan: r.catatan ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!sheetName"] = "grosir";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "grosir");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;
}

/* ─── ImportGrosirService ─── */

describe("ImportGrosirService", () => {
  it("builds grosirMap from a single SKU with single tier", () => {
    const buffer = createGrosirBuffer([
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].sku).toBe("LBM-100");
    expect(result.data[0].hargaGrosir).toBe(90000);
    expect(result.grosirMap.get("lbm-100")).toHaveLength(1);
    expect(result.grosirMap.get("lbm-100")![0].minQty).toBe(10);
  });

  it("builds grosirMap with multiple tiers per SKU", () => {
    const buffer = createGrosirBuffer([
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
      { sku: "LBM-100", baseHarga: 100000, minQty: 20, hargaGrosir: 85000, mulaiBerlaku: "2025-01-01" },
      { sku: "LBM-100", baseHarga: 100000, minQty: 50, hargaGrosir: 80000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    const tiers = result.grosirMap.get("lbm-100")!;
    expect(tiers).toHaveLength(3);
    expect(tiers[0].minQty).toBe(10);
    expect(tiers[1].minQty).toBe(20);
    expect(tiers[2].minQty).toBe(50);
  });

  it("groups multiple SKUs separately", () => {
    const buffer = createGrosirBuffer([
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
      { sku: "RKS-50", baseHarga: 50000, minQty: 10, hargaGrosir: 45000, mulaiBerlaku: "2025-01-01" },
      { sku: "LBM-100", baseHarga: 100000, minQty: 20, hargaGrosir: 85000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.grosirMap.get("lbm-100")).toHaveLength(2);
    expect(result.grosirMap.get("rks-50")).toHaveLength(1);
  });

  it("normalizes SKU to lowercase trimmed", () => {
    const buffer = createGrosirBuffer([
      { sku: "  LBM-100  ", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.grosirMap.has("lbm-100")).toBe(true);
    expect(result.grosirMap.has("  lbm-100  ")).toBe(false);
  });

  it("returns empty grosirMap for empty file", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["SKU", "Base Harga", "Min Qty", "Harga Grosir", "Mulai Berlaku"],
    ]);
    worksheet["!sheetName"] = "grosir";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "grosir");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;

    const result = ImportGrosirService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.grosirMap.size).toBe(0);
  });

  it("returns grosirMap with correct size for multiple SKUs", () => {
    const buffer = createGrosirBuffer([
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
      { sku: "RKS-50", baseHarga: 50000, minQty: 10, hargaGrosir: 45000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.grosirMap.size).toBe(2);
  });

  it("preserves optional fields (berlakuSampai, catatan)", () => {
    const buffer = createGrosirBuffer([
      {
        sku: "LBM-100",
        baseHarga: 100000,
        minQty: 10,
        hargaGrosir: 90000,
        mulaiBerlaku: "2025-01-01",
        berlakuSampai: "2025-12-31",
        catatan: "Promo akhir tahun",
      },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.success).toBe(true);
    expect(result.data[0].berlakuSampai).toBe("2025-12-31");
    expect(result.data[0].catatan).toBe("Promo akhir tahun");
  });

  it("overwrites duplicate SKU entry with last occurrence (same key, appended)", () => {
    const buffer = createGrosirBuffer([
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 90000, mulaiBerlaku: "2025-01-01" },
      { sku: "LBM-100", baseHarga: 100000, minQty: 10, hargaGrosir: 95000, mulaiBerlaku: "2025-01-01" },
    ]);

    const result = ImportGrosirService.import(buffer);
    expect(result.data).toHaveLength(2);
    const tiers = result.grosirMap.get("lbm-100")!;
    expect(tiers).toHaveLength(2);
    expect(tiers[1].hargaGrosir).toBe(95000);
  });
});
