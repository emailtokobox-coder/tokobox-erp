/**
 * @module features/inventory/services/StockHistoryService
 * Stock History Service — generates stock movements from imported order items.
 *
 * Business Logic (PRD Section 5.8):
 *   - qty_valid > 0 → KELUAR (items leaving warehouse to customer)
 *   - qty_return > 0 → MASUK (items returning from customer)
 *
 * Usage:
 *   const movements = StockHistoryService.build(orderItems, storeId);
 *
 * Architecture:
 *   OrderItemProcessed[] → buildStockMovements() → StockMovementRow[]
 */

import type { OrderItemProcessed } from "@/features/upload/types";
import type { StockMovementRow } from "../types";

/* ─── Stock Movement Row (for DB insertion) ─── */

/**
 * Build stock movement records from processed order items.
 *
 * For each non-batal item:
 *   - qty_valid > 0 → one KELUAR record (stock leaving to customer)
 *   - qty_return > 0 → one MASUK record (stock returning from customer)
 *
 * @param items - Processed order items from ImportOrderService
 * @returns Array of stock movement rows ready for DB insertion
 */
export function buildStockMovements(
  items: OrderItemProcessed[],
): StockMovementRow[] {
  const movements: StockMovementRow[] = [];

  for (const item of items) {
    // Skip batal items — no stock movement for cancelled orders
    if (item.statusItem === "BATAL") continue;

    // KELUAR: items shipped to customer (qty_valid)
    if (item.qtyValid > 0) {
      movements.push({
        baseProduct: item.sku,
        tipe: "KELUAR",
        tanggal: "", // filled by caller with order date
        noRef: item.noPesanan,
        qtyBaseUnit: item.qtyValid,
        source: "shopee",
        supplier: "",
        keterangan: `Pesanan ${item.noPesanan} — ${item.namaProduk}${item.namaVariasi ? ` (${item.namaVariasi})` : ""}`,
      });
    }

    // MASUK: items returned by customer (qty_return)
    if (item.qtyReturn > 0) {
      movements.push({
        baseProduct: item.sku,
        tipe: "MASUK",
        tanggal: "", // filled by caller with order date
        noRef: item.noPesanan,
        qtyBaseUnit: item.qtyReturn,
        source: "shopee",
        supplier: "",
        keterangan: `Retur pesanan ${item.noPesanan} — ${item.namaProduk}${item.namaVariasi ? ` (${item.namaVariasi})` : ""}`,
      });
    }
  }

  return movements;
}

/**
 * Enrich stock movements with dates from order headers.
 * Maps noPesanan → waktuPesananDibuat for tanggal assignment.
 *
 * @param movements - Stock movements from buildStockMovements()
 * @param orderDates - Map of noPesanan → waktuPesananDibuat
 * @returns Enriched stock movements with tanggal filled in
 */
export function enrichStockMovementsWithDates(
  movements: StockMovementRow[],
  orderDates: Map<string, string>
): StockMovementRow[] {
  return movements.map((movement) => {
    const waktuPesanan = orderDates.get(movement.noRef) ?? "";
    const tanggal = extractDateOnly(waktuPesanan);
    return { ...movement, tanggal };
  });
}

/**
 * Extract yyyy-mm-dd from a datetime string.
 * Falls back to empty string if format is unrecognized.
 */
function extractDateOnly(datetime: string): string {
  if (!datetime) return "";
  try {
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}
