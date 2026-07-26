/**
 * @module manual-orders/constants
 * Constants for Manual Orders feature.
 */

// ─── Tipe Pesanan ───

export const MANUAL_ORDER_TYPES = [
  "MANUAL_CASH",
  "MANUAL_DP",
  "MANUAL_TERMIN",
] as const

export type ManualOrderType = (typeof MANUAL_ORDER_TYPES)[number]

// ─── Status Order ───

export const MANUAL_ORDER_STATUSES = [
  "Draft",
  "Invoice_Terkirim",
  "Menunggu_Pembayaran_DP",
  "DP_Lunas",
  "Pelunasan_Diminta",
  "Pelunasan_Diterima",
  "ACC_Termin",
  "Kirim_Invoice_Tagihan",
  "Produksi",
  "Siap_Kirim",
  "Terkirim",
  "Lunas",
  "Selesai",
] as const

export type ManualOrderStatus = (typeof MANUAL_ORDER_STATUSES)[number]

// ─── Metode Pembayaran ───

export const PAYMENT_METHODS = [
  "cash",
  "transfer",
  "qris",
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

// ─── Status Flow Groups (for UI display) ───

export const CASH_STATUS_FLOW: ManualOrderStatus[] = [
  "Draft",
  "Invoice_Terkirim",
  "Terkirim",
  "Lunas",
  "Selesai",
]

export const DP_STATUS_FLOW: ManualOrderStatus[] = [
  "Draft",
  "Invoice_Terkirim",
  "Menunggu_Pembayaran_DP",
  "DP_Lunas",
  "Pelunasan_Diminta",
  "Pelunasan_Diterima",
  "Terkirim",
  "Lunas",
  "Selesai",
]

export const TERMIN_STATUS_FLOW: ManualOrderStatus[] = [
  "Draft",
  "Invoice_Terkirim",
  "ACC_Termin",
  "Kirim_Invoice_Tagihan",
  "Produksi",
  "Siap_Kirim",
  "Terkirim",
  "Lunas",
  "Selesai",
]

// ─── WhatsApp Types ───

export const WHATSAPP_TYPES = [
  "INVOICE",
  "RESI",
  "PELUNASAN",
  "FOLLOW_UP",
  "DP_REQUEST",
] as const

export type WhatsAppType = (typeof WHATSAPP_TYPES)[number]

// ─── Routes ───

export const MANUAL_ORDER_ROUTES = {
  list: "/manual-orders",
  detail: (id: string) => `/manual-orders/${id}`,
  create: "/manual-orders/new",
  edit: (id: string) => `/manual-orders/${id}/edit`,
} as const

// ─── Status Flow Helpers ───

/** Return the status flow array for a given tipePesanan. */
export function getStatusFlow(tipe: ManualOrderType): ManualOrderStatus[] {
  switch (tipe) {
    case "MANUAL_CASH":
      return CASH_STATUS_FLOW
    case "MANUAL_DP":
      return DP_STATUS_FLOW
    case "MANUAL_TERMIN":
      return TERMIN_STATUS_FLOW
  }
}

/** Return valid next statuses from the current position in the flow. */
export function getNextStatuses(
  current: ManualOrderStatus,
  tipe: ManualOrderType
): ManualOrderStatus[] {
  const flow = getStatusFlow(tipe)
  const idx = flow.indexOf(current)
  if (idx < 0 || idx >= flow.length - 1) return []
  return [flow[idx + 1]]
}

/** Check if a status transition is valid for the given tipe. */
export function canTransition(
  from: ManualOrderStatus,
  to: ManualOrderStatus,
  tipe: ManualOrderType
): boolean {
  const next = getNextStatuses(from, tipe)
  return next.includes(to)
}

/** Get the display label for a status (human-readable). */
export function getStatusLabel(status: ManualOrderStatus): string {
  const labels: Record<ManualOrderStatus, string> = {
    Draft: "Draft",
    Invoice_Terkirim: "Invoice Terkirim",
    Menunggu_Pembayaran_DP: "Menunggu DP",
    DP_Lunas: "DP Lunas",
    Pelunasan_Diminta: "Minta Pelunasan",
    Pelunasan_Diterima: "Pelunasan Diterima",
    ACC_Termin: "ACC Termin",
    Kirim_Invoice_Tagihan: "Kirim Tagihan",
    Produksi: "Produksi",
    Siap_Kirim: "Siap Kirim",
    Terkirim: "Terkirim",
    Lunas: "Lunas",
    Selesai: "Selesai",
  }
  return labels[status] ?? status
}
