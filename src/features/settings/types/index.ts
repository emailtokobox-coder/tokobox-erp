/**
 * @module settings/types
 * Core types for the Settings feature.
 */

// ─── Store Profile ───

export interface StoreProfile {
  id: string
  storeId: string
  namaToko: string
  alamat: string
  noTelepon: string
  marketplaceRatePct: number
  currency: string
}

// ─── App Settings ───

export interface AppSettings {
  id: string
  defaultMinHari: number
  theme: "light" | "dark" | "system"
  language: "id" | "en"
}

// ─── User Account ───

export type UserRole = "admin" | "staff" | "viewer"

export interface UserAccount {
  id: string
  email: string
  nama: string
  role: UserRole
  aktif: boolean
  createdAt: string
}

// ─── Backup ───

export type BackupType = "database" | "invoice_pdf" | "foto_resi" | "arsip_data"

export interface BackupRecord {
  id: string
  tipe: BackupType
  namaFile: string
  ukuran: string
  tanggal: string
  status: "success" | "failed" | "pending"
}
