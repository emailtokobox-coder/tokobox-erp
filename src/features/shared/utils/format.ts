/**
 * Formatting utilities — currency, numbers, dates, and SKU normalization.
 *
 * These are pure functions (no side effects) for easy unit testing.
 */

/**
 * Format a number as Indonesian Rupiah.
 *
 * @example formatRupiah(15000) → "Rp 15.000"
 * @example formatRupiah(1500000) → "Rp 1.500.000"
 */
export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/**
 * Format a number with thousand separators (no currency symbol).
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

/**
 * Format a Date as DD/MM/YYYY.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date as DD/MM/YYYY HH:mm.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hours}:${minutes}`;
}

/**
 * Normalize an SKU string: uppercase, trim whitespace, collapse spaces.
 */
export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase().replace(/\s+/g, "-");
}
