/**
 * @module manual-orders/types
 * Core domain types for the Manual Orders feature.
 *
 * Based on PRD Section 7.9 + Database Schema Section 5.15-5.18
 */

// ─── Tipe Pesanan ───

export type ManualOrderType = "MANUAL_CASH" | "MANUAL_DP" | "MANUAL_TERMIN"

// ─── Status Order ───

export type ManualOrderStatus =
  | "Draft"
  | "Invoice_Terkirim"
  | "Menunggu_Pembayaran_DP"
  | "DP_Lunas"
  | "Pelunasan_Diminta"
  | "Pelunasan_Diterima"
  | "ACC_Termin"
  | "Kirim_Invoice_Tagihan"
  | "Produksi"
  | "Siap_Kirim"
  | "Terkirim"
  | "Lunas"
  | "Selesai"

// ─── Metode Pembayaran ───

export type PaymentMethod = "cash" | "transfer" | "qris"

// ─── Manual Order Item (inside JSONB items) ───

export interface ManualOrderItem {
  id?: string
  namaProduk: string
  qty: number
  hargaSatuan: number
  beratGram?: number
  subtotal: number
}

// ─── Manual Order Header ───

export interface ManualOrder {
  id?: string
  storeId: string
  noManualOrder: string
  tipePesanan: ManualOrderType
  statusOrder: ManualOrderStatus
  metodePembayaran: PaymentMethod
  tanggal?: string
  namaPelanggan: string
  alamat: string
  noHp: string
  ekspedisi: string
  biayaOngkir: number
  diskonPersen: number
  diskonNominal: number
  pajak: number
  total: number
  totalBayar: number
  sisaPembayaran: number
  dpPersentase?: number
  dpNominal?: number
  terminSchedule: Record<string, unknown>[]
  items: ManualOrderItem[]
  subtotal: number
  catatan: string
  createdAt?: string
  updatedAt?: string
}

// ─── DP Payment ───

export interface DpPayment {
  id?: string
  manualOrderId?: string
  urutan: number
  tanggal: string
  persentase: number
  nominal: number
  metodePembayaran: PaymentMethod
  konfirmasiBukti: string
  status: "Pending" | "Lunas" | "Ditolak"
  createdAt?: string
}

// ─── Termin Payment ───

export interface TerminPayment {
  id?: string
  manualOrderId?: string
  urutan: number
  tanggalJatuhTempo: string
  persentase: number
  nominal: number
  metodePembayaran: PaymentMethod
  status: "Pending" | "Lunas" | "Ditolak"
  konfirmasiBukti: string
  catatan: string
  createdAt?: string
}

// ─── Resi Data ───

export interface ResiData {
  id?: string
  manualOrderId: string
  noResi: string
  ekspedisi: string
  tanggalKirim: string
  buktiFoto: string
  resiTerkirimWp: boolean
  createdAt?: string
}

// ─── WhatsApp Log ───

export type WhatsAppType = "INVOICE" | "RESI" | "PELUNASAN" | "FOLLOW_UP" | "DP_REQUEST"

export interface WhatsAppLog {
  id?: string
  manualOrderId: string
  tipe: WhatsAppType
  nomorWp: string
  pesan: string
  status: "Terkirim" | "Gagal" | "Pending"
  createdAt?: string
}
