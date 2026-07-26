/**
 * @module features/upload/tests/ImportOrderService.test
 * Tests for ImportOrderService — processItem() and processHeader().
 *
 * Business logic per PRD Section 3.8 (Logic Item) + 3.9 (Logic Order Header).
 */

import { describe, it, expect } from "vitest";
import { processItem, processHeader } from "@/features/upload/services/ImportOrderService";
import type { OrderAllRow, OrderItemProcessed } from "@/features/upload/types";

/* ─── Helpers ─── */

function makeRow(overrides: Partial<OrderAllRow> = {}): OrderAllRow {
  return {
    noPesanan: "ORD-001",
    statusPesanan: "Selesai",
    statusPembatalanPengembalian: "",
    ekspedisi: "JNE",
    waktuPesananDibuat: "2025-01-15",
    metodePembayaran: "Transfer",
    namaProduk: "Lemari",
    sku: "LBM-100",
    qtyOrder: 2,
    qtyReturn: 0,
    omzetItem: 180000,
    usernamePembeli: "buyer1",
    kotaKabupaten: "Jakarta",
    waktuPesananSelesai: "2025-01-16",
    namaVariasi: "Coklat",
    ...overrides,
  };
}

function makeItem(overrides: Partial<OrderItemProcessed> = {}): OrderItemProcessed {
  return {
    noPesanan: "ORD-001",
    sku: "lbm-100",
    namaProduk: "Lemari",
    namaVariasi: "Coklat",
    qtyOrder: 2,
    qtyReturn: 0,
    qtyValid: 2,
    hargaPerQty: 90000,
    omzetValid: 180000,
    omzetRetur: 0,
    hppValid: 100000,
    hppRetur: 0,
    statusItem: "NORMAL",
    itemHash: "abc123",
    ...overrides,
  };
}

/* ─── processItem() ─── */

describe("processItem()", () => {
  it("returns NORMAL when qtyReturn is 0", () => {
    const result = processItem(makeRow({ qtyOrder: 2, qtyReturn: 0, omzetItem: 180000 }), new Map());
    expect(result.statusItem).toBe("NORMAL");
    expect(result.qtyValid).toBe(2);
    expect(result.omzetValid).toBe(180000);
    expect(result.hppValid).toBe(0);
  });

  it("returns PARTIAL_RETURN when some items returned", () => {
    const result = processItem(
      makeRow({ qtyOrder: 4, qtyReturn: 1, omzetItem: 360000 }),
      new Map()
    );
    expect(result.statusItem).toBe("PARTIAL_RETURN");
    expect(result.qtyReturn).toBe(1);
    expect(result.qtyValid).toBe(3);
    expect(result.omzetValid).toBe(270000);
    expect(result.omzetRetur).toBe(90000);
  });

  it("returns FULL_RETURN when all items returned", () => {
    const result = processItem(
      makeRow({ qtyOrder: 2, qtyReturn: 2, omzetItem: 180000 }),
      new Map()
    );
    expect(result.statusItem).toBe("FULL_RETURN");
    expect(result.qtyValid).toBe(0);
    expect(result.omzetRetur).toBe(180000);
  });

  it("returns BATAL when status includes 'batal'", () => {
    const result = processItem(
      makeRow({ statusPesanan: "Batal", qtyOrder: 2, qtyReturn: 0, omzetItem: 180000 }),
      new Map()
    );
    expect(result.statusItem).toBe("BATAL");
    // Note: omzetValid/hppValid are NOT zeroed in processItem — that happens in processHeader
  });

  it("caps qtyReturn at qtyOrder", () => {
    const result = processItem(
      makeRow({ qtyOrder: 2, qtyReturn: 5, omzetItem: 180000 }),
      new Map()
    );
    expect(result.qtyReturn).toBe(2);
    expect(result.qtyValid).toBe(0);
    expect(result.statusItem).toBe("FULL_RETURN");
  });

  it("applies hppPerSku from map (lowercase match)", () => {
    const hppMap = new Map<string, number>([["lbm-100", 45000]]);
    const result = processItem(
      makeRow({ sku: "lbm-100", qtyOrder: 2, qtyReturn: 0, omzetItem: 180000 }),
      hppMap
    );
    expect(result.hppValid).toBe(90000);
    expect(result.hppRetur).toBe(0);
  });

  it("returns 0 hpp when SKU not in map", () => {
    const result = processItem(makeRow({ sku: "unknown" }), new Map());
    expect(result.hppValid).toBe(0);
  });

  it("calculates hargaPerQty correctly", () => {
    const result = processItem(
      makeRow({ qtyOrder: 3, qtyReturn: 0, omzetItem: 300000 }),
      new Map()
    );
    expect(result.hargaPerQty).toBe(100000);
  });

  it("generates itemHash deterministically", () => {
    const row = makeRow({ qtyOrder: 2, qtyReturn: 0, omzetItem: 180000 });
    const r1 = processItem(row, new Map());
    const r2 = processItem(row, new Map());
    expect(r1.itemHash).toBe(r2.itemHash);
  });
});

/* ─── processHeader() ─── */

describe("processHeader()", () => {
  it("groups and aggregates items by noPesanan", () => {
    const items = [
      makeItem({ noPesanan: "ORD-1", qtyOrder: 2, qtyValid: 2, omzetValid: 180000, hppValid: 100000 }),
      makeItem({ noPesanan: "ORD-1", qtyOrder: 1, qtyValid: 1, omzetValid: 90000, hppValid: 50000 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.totalQtyOrder).toBe(3);
    expect(header.totalQtyValid).toBe(3);
    expect(header.totalOmzetValid).toBe(270000);
    expect(header.totalHppValid).toBe(150000);
  });

  it("sets Selesai / Normal for non-cancelled orders", () => {
    const items = [makeItem({ statusItem: "NORMAL", qtyValid: 2, qtyReturn: 0 })];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusOrderFinal).toBe("Selesai / Normal");
  });

  it("sets Batal for cancelled orders and zeros out omzet/HPP", () => {
    const items = [
      makeItem({ statusItem: "BATAL", omzetValid: 100000, hppValid: 50000 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusOrderFinal).toBe("Batal");
    expect(header.totalOmzetValid).toBe(0);
    expect(header.totalHppValid).toBe(0);
  });

  it("sets Retur Sebagian for partial returns", () => {
    const items = [
      makeItem({ statusItem: "PARTIAL_RETURN", qtyValid: 3, qtyReturn: 1 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusOrderFinal).toBe("Retur Sebagian");
  });

  it("sets Retur Full when all items returned", () => {
    const items = [
      makeItem({ statusItem: "FULL_RETURN", qtyValid: 0, qtyReturn: 2 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusOrderFinal).toBe("Retur Full");
  });

  it("sets HPP Lengkap when all valid items have HPP", () => {
    const hppMap = new Map<string, number>([["lbm-100", 50000]]);
    const items = [makeItem({ sku: "lbm-100", statusItem: "NORMAL", hppValid: 100000 })];
    const header = processHeader("ORD-1", items, hppMap);
    expect(header.statusHpp).toBe("HPP Lengkap");
  });

  it("sets HPP Sebagian when some items have HPP", () => {
    const hppMap = new Map<string, number>([["lbm-100", 50000]]);
    const items = [
      makeItem({ sku: "lbm-100", statusItem: "NORMAL", hppValid: 100000 }),
      makeItem({ sku: "unknown", statusItem: "NORMAL", hppValid: 0 }),
    ];
    const header = processHeader("ORD-1", items, hppMap);
    expect(header.statusHpp).toBe("HPP Sebagian");
  });

  it("sets HPP Kosong when no items have HPP", () => {
    const items = [
      makeItem({ sku: "unknown", statusItem: "NORMAL", hppValid: 0 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusHpp).toBe("HPP Kosong");
  });

  it("sets Tidak Perlu HPP / Batal for Batal orders", () => {
    const hppMap = new Map<string, number>([["lbm-100", 50000]]);
    const items = [
      makeItem({ sku: "lbm-100", statusItem: "BATAL", hppValid: 0 }),
    ];
    const header = processHeader("ORD-1", items, hppMap);
    expect(header.statusHpp).toBe("Tidak Perlu HPP / Batal");
  });

  it("returns default statusIncome and statusProfit", () => {
    const items = [makeItem()];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.statusIncome).toBe("Belum Ada Income");
    expect(header.statusProfit).toBe("Belum Ada Income");
  });

  it("aggregates omzetRetur and hppRetur correctly", () => {
    const items = [
      makeItem({ qtyValid: 2, qtyReturn: 1, omzetValid: 180000, omzetRetur: 90000, hppValid: 100000, hppRetur: 50000 }),
      makeItem({ qtyValid: 1, qtyReturn: 0, omzetValid: 90000, omzetRetur: 0, hppValid: 50000, hppRetur: 0 }),
    ];
    const header = processHeader("ORD-1", items, new Map());
    expect(header.totalOmzetRetur).toBe(90000);
    expect(header.totalHppRetur).toBe(50000);
    expect(header.totalQtyReturn).toBe(1);
  });
});
