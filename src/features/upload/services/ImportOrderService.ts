/**
 * @module features/upload/services/ImportOrderService
 * Import Order All service — orchestrates parse → validate → business logic.
 * Business logic per PRD Section 3.8 (Logic Item) + 3.9 (Logic Order Header).
 */

import { readExcelFile, getSheetNames, detectFileType, parseOrderAll } from "@/lib/xlsx";
import type { OrderAllRow, OrderItemProcessed, OrderHeaderProcessed, ImportResult } from "../types";

/* ─── Business Logic: Process Item (PRD 3.8) ─── */

export function processItem(row: OrderAllRow, hppMap: Map<string, number>): OrderItemProcessed {
  /* 1-2. qty_return guard */
  const qtyReturn = Math.min(row.qtyReturn, row.qtyOrder);
  const qtyValid = row.qtyOrder - qtyReturn;

  /* 4. nilai_item_total */
  const nilaiItemTotal = row.omzetItem;

  /* 5. harga_per_qty */
  const hargaPerQty = row.qtyOrder > 0 ? nilaiItemTotal / row.qtyOrder : 0;

  /* 6-7. omzet */
  const omzetValid = hargaPerQty * qtyValid;
  const omzetRetur = hargaPerQty * qtyReturn;

  /* 8. HPP */
  const hppPerSku = hppMap.get(row.sku) ?? 0;
  const hppValid = hppPerSku * qtyValid;
  const hppRetur = hppPerSku * qtyReturn;

  /* 9. status_item */
  let statusItem: OrderItemProcessed["statusItem"];
  if (row.statusPesanan.toLowerCase().includes("batal")) {
    statusItem = "BATAL";
  } else if (qtyReturn === 0 && qtyValid > 0) {
    statusItem = "NORMAL";
  } else if (qtyReturn > 0 && qtyValid > 0) {
    statusItem = "PARTIAL_RETURN";
  } else if (qtyReturn > 0 && qtyValid === 0) {
    statusItem = "FULL_RETURN";
  } else {
    statusItem = "NORMAL";
  }

  /* 10. item_hash — SHA-256 per PRD 3.14 */
  const itemHash = syncItemHash(
    row.noPesanan +
    row.sku +
    row.namaProduk +
    (row.namaVariasi ?? "") +
    row.qtyOrder +
    qtyReturn +
    nilaiItemTotal +
    row.statusPesanan
  );

  return {
    noPesanan: row.noPesanan,
    sku: row.sku,
    namaProduk: row.namaProduk,
    namaVariasi: row.namaVariasi,
    qtyOrder: row.qtyOrder,
    qtyReturn,
    qtyValid,
    hargaPerQty,
    omzetValid,
    omzetRetur,
    hppValid,
    hppRetur,
    statusItem,
    itemHash,
    waktuPesananDibuat: row.waktuPesananDibuat,
  };
}

/* ─── Business Logic: Process Header (PRD 3.9) ─── */

export function processHeader(
  noPesanan: string,
  items: OrderItemProcessed[],
  hppMap: Map<string, number> = new Map(),
  waktuPesananDibuat?: string
): OrderHeaderProcessed {
  /* 1-7. Aggregate totals */
  const totalQtyOrder = items.reduce((s, i) => s + i.qtyOrder, 0);
  const totalQtyReturn = items.reduce((s, i) => s + i.qtyReturn, 0);
  const totalQtyValid = items.reduce((s, i) => s + i.qtyValid, 0);
  const totalOmzetValid = items.reduce((s, i) => s + i.omzetValid, 0);
  const totalOmzetRetur = items.reduce((s, i) => s + i.omzetRetur, 0);
  const totalHppValid = items.reduce((s, i) => s + i.hppValid, 0);
  const totalHppRetur = items.reduce((s, i) => s + i.hppRetur, 0);

  /* 8. status_order_final */
  const isBatal = items.some((i) => i.statusItem === "BATAL");
  let statusOrderFinal: OrderHeaderProcessed["statusOrderFinal"];
  if (isBatal) {
    statusOrderFinal = "Batal";
  } else if (totalQtyReturn === 0 && totalQtyValid > 0) {
    statusOrderFinal = "Selesai / Normal";
  } else if (totalQtyReturn > 0 && totalQtyValid > 0) {
    statusOrderFinal = "Retur Sebagian";
  } else if (totalQtyReturn > 0 && totalQtyValid === 0) {
    statusOrderFinal = "Retur Full";
  } else {
    statusOrderFinal = "Selesai / Normal";
  }

  /* 9. status_hpp */
  const validItems = items.filter((i) => i.statusItem !== "BATAL");
  const hasValidItems = validItems.some((i) => i.qtyValid > 0);
  let statusHpp: OrderHeaderProcessed["statusHpp"];
  if (isBatal) {
    statusHpp = "Tidak Perlu HPP / Batal";
  } else if (!hasValidItems) {
    statusHpp = "Tidak Perlu HPP / Batal";
  } else if (validItems.every((i) => hppMap.get(i.sku) && hppMap.get(i.sku)! > 0)) {
    statusHpp = "HPP Lengkap";
  } else if (validItems.some((i) => hppMap.get(i.sku) && hppMap.get(i.sku)! > 0)) {
    statusHpp = "HPP Sebagian";
  } else {
    statusHpp = "HPP Kosong";
  }

  /* 10. Default values */
  const statusIncome = "Belum Ada Income";
  const statusProfit = "Belum Ada Income";

  return {
    noPesanan,
    storeId: "default",
    totalQtyOrder,
    totalQtyReturn,
    totalQtyValid,
    totalOmzetValid: statusOrderFinal === "Batal" ? 0 : totalOmzetValid,
    totalOmzetRetur,
    totalHppValid: statusOrderFinal === "Batal" ? 0 : totalHppValid,
    totalHppRetur,
    statusOrderFinal,
    statusHpp,
    statusIncome,
    statusProfit,
    waktuPesananDibuat,
  };
}

/* ─── Sync SHA-256 Hash (PRD 3.14) ─── */

function syncItemHash(input: string): string {
  // Use Node crypto (available in server actions) for deterministic SHA-256
  try {
    const nodeCrypto = require("crypto");
    return nodeCrypto.createHash("sha256").update(input).digest("hex");
  } catch {
    // Fallback: deterministic hex hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}

/* ─── Import Order Service ─── */

export class ImportOrderService {
  /**
   * Import Order All Excel file.
   * @param buffer - ArrayBuffer of the Excel file
   * @param hppMap - Map of SKU → HPP value (from prior HPP import or manual input)
   * @returns ImportResult with processed items + headers
   */
  static import(buffer: ArrayBuffer, hppMap: Map<string, number> = new Map()): ImportResult<OrderItemProcessed> {
    const result: ImportResult<OrderItemProcessed> = {
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
      /* 1. Read workbook */
      const workbook = readExcelFile(buffer);
      const sheetNames = getSheetNames(workbook);

      /* 2. Detect file type */
      const fileType = detectFileType(sheetNames, "Order.all.xlsx");
      if (fileType !== "ORDER_ALL") {
        result.errors.push(`File tidak terdeteksi sebagai Order All. Sheet: ${sheetNames.join(", ")}`);
        result.status = "error";
        return result;
      }

      /* 3. Parse */
      const worksheet = workbook.Sheets[sheetNames[0]];
      if (!worksheet) {
        result.errors.push("Sheet tidak ditemukan dalam file");
        result.status = "error";
        return result;
      }

      const parseResult = parseOrderAll(worksheet, "Order.all.xlsx");
      result.summary.totalRows = parseResult.metadata.totalRows;
      result.summary.parsedRows = parseResult.metadata.parsedRows;

      /* 4. Collect parse errors/warnings */
      for (const err of parseResult.errors) {
        result.errors.push(`[Baris ${err.row}] ${err.field}: ${err.message}`);
      }
      for (const warn of parseResult.warnings) {
        result.warnings.push(`[Baris ${warn.row}] ${warn.field}: ${warn.message}`);
      }

      /* 5. Apply business logic */
      const items = parseResult.data.map((row) => processItem(row, hppMap));

      /* 6. Group by no_pesanan → build headers */
      const orderGroups = new Map<string, OrderItemProcessed[]>();
      for (const item of items) {
        const existing = orderGroups.get(item.noPesanan) ?? [];
        existing.push(item);
        orderGroups.set(item.noPesanan, existing);
      }

      /* Validate: every order must have at least one item */
      if (orderGroups.size === 0) {
        result.errors.push("Tidak ada pesanan yang valid ditemukan");
        result.status = "error";
        return result;
      }

      result.data = items;
      result.summary.validRows = items.length;
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

  /**
   * Build order headers from processed items.
   * @param items - Processed order items from import()
   * @returns Map of noPesanan → OrderHeaderProcessed
   */
  static buildHeaders(items: OrderItemProcessed[], hppMap: Map<string, number> = new Map()): Map<string, OrderHeaderProcessed> {
    const orderGroups = new Map<string, OrderItemProcessed[]>();
    for (const item of items) {
      const existing = orderGroups.get(item.noPesanan) ?? [];
      existing.push(item);
      orderGroups.set(item.noPesanan, existing);
    }

    const headers = new Map<string, OrderHeaderProcessed>();
    for (const [noPesanan, groupItems] of orderGroups) {
      // Use first item's waktuPesananDibuat as representative date
      const waktuPesananDibuat = groupItems[0]?.waktuPesananDibuat;
      headers.set(noPesanan, processHeader(noPesanan, groupItems, hppMap, waktuPesananDibuat));
    }
    return headers;
  }
}
