import { describe, it, expect } from "vitest";
import { formatRupiah, formatNumber, formatDate, formatDateTime, normalizeSku } from "@/features/shared/utils/format";

describe("formatRupiah()", () => {
  it("formats zero", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("formats positive numbers with thousand separators", () => {
    expect(formatRupiah(15000)).toBe("Rp 15.000");
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
  });

  it("formats negative numbers", () => {
    expect(formatRupiah(-5000)).toBe("Rp -5.000");
  });
});

describe("formatNumber()", () => {
  it("formats numbers without currency symbol", () => {
    expect(formatNumber(15000)).toBe("15.000");
    expect(formatNumber(1500000)).toBe("1.500.000");
  });
});

describe("formatDate()", () => {
  it("formats Date object as DD/MM/YYYY", () => {
    const d = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDate(d)).toBe("15/01/2025");
  });

  it("formats ISO string", () => {
    expect(formatDate("2025-06-20")).toBe("20/06/2025");
  });
});

describe("formatDateTime()", () => {
  it("formats Date object as DD/MM/YYYY HH:mm", () => {
    const d = new Date(2025, 0, 15, 14, 30);
    expect(formatDateTime(d)).toBe("15/01/2025 14:30");
  });
});

describe("normalizeSku()", () => {
  it("uppercases the SKU", () => {
    expect(normalizeSku("abc-123")).toBe("ABC-123");
  });

  it("trims whitespace", () => {
    expect(normalizeSku("  abc-123  ")).toBe("ABC-123");
  });

  it("collapses multiple spaces into hyphens", () => {
    expect(normalizeSku("abc  123")).toBe("ABC-123");
  });
});
