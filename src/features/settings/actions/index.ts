/**
 * @module settings/actions
 * Server Actions — CRUD for settings, profile, users, and backup.
 *
 * Per PRD 7.11:
 *   - Store profile (nama toko, alamat, telepon, rate, currency)
 *   - App settings (min hari, theme, language)
 *   - User management (CRUD + role assignment)
 *   - Backup manager (database, invoice PDF, foto resi, arsip)
 */

"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import type { StoreProfile, AppSettings, UserAccount, UserRole, BackupRecord, BackupType } from "../types";

// ─── Supabase Client ───

function getClient() {
  return createSupabaseClient()
}

// ─── Store Profile ───

export async function getStoreProfileAction(): Promise<StoreProfile | null> {
  try {
    const client = getClient()
    const { data, error } = await client
      .from("settings")
      .select("*")
      .eq("id", "store_profile")
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      storeId: data.store_id ?? "",
      namaToko: data.company_name ?? "",
      alamat: data.company_address ?? "",
      noTelepon: data.company_phone ?? "",
      marketplaceRatePct: Number(data.marketplace_rate_pct ?? 25),
      currency: data.currency ?? "IDR",
    }
  } catch {
    return null
  }
}

export async function updateStoreProfileAction(
  data: Partial<StoreProfile>
): Promise<StoreProfile | null> {
  try {
    const client = getClient()
    const payload: Record<string, unknown> = {}

    if (data.namaToko !== undefined) payload["company_name"] = data.namaToko
    if (data.alamat !== undefined) payload["company_address"] = data.alamat
    if (data.noTelepon !== undefined) payload["company_phone"] = data.noTelepon
    if (data.marketplaceRatePct !== undefined) payload["marketplace_rate_pct"] = data.marketplaceRatePct
    if (data.currency !== undefined) payload["currency"] = data.currency

    const { data: result, error } = await client
      .from("settings")
      .upsert({ id: "store_profile", ...payload })
      .select()
      .single()

    if (error || !result) return null

    return {
      id: result.id,
      storeId: result.store_id ?? "",
      namaToko: result.company_name ?? "",
      alamat: result.company_address ?? "",
      noTelepon: result.company_phone ?? "",
      marketplaceRatePct: Number(result.marketplace_rate_pct ?? 25),
      currency: result.currency ?? "IDR",
    }
  } catch {
    return null
  }
}

// ─── App Settings ───

export async function getAppSettingsAction(): Promise<AppSettings | null> {
  try {
    const client = getClient()
    const { data, error } = await client
      .from("settings")
      .select("*")
      .eq("id", "app_settings")
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      defaultMinHari: Number(data.default_min_hari ?? 7),
      theme: (data.theme as AppSettings["theme"]) ?? "system",
      language: (data.language as AppSettings["language"]) ?? "id",
    }
  } catch {
    return null
  }
}

export async function updateAppSettingsAction(
  data: Partial<AppSettings>
): Promise<AppSettings | null> {
  try {
    const client = getClient()
    const payload: Record<string, unknown> = {}

    if (data.defaultMinHari !== undefined) payload["default_min_hari"] = data.defaultMinHari
    if (data.theme !== undefined) payload["theme"] = data.theme
    if (data.language !== undefined) payload["language"] = data.language

    const { data: result, error } = await client
      .from("settings")
      .upsert({ id: "app_settings", ...payload })
      .select()
      .single()

    if (error || !result) return null

    return {
      id: result.id,
      defaultMinHari: Number(result.default_min_hari ?? 7),
      theme: (result.theme as AppSettings["theme"]) ?? "system",
      language: (result.language as AppSettings["language"]) ?? "id",
    }
  } catch {
    return null
  }
}

// ─── User Management ───

export async function getUsersAction(): Promise<UserAccount[]> {
  try {
    const client = getClient()
    const { data, error } = await client
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => ({
      id: row["id"] as string,
      email: (row["email"] as string) || "",
      nama: (row["nama"] as string) || "",
      role: ((row["role"] as string) || "viewer") as UserRole,
      aktif: Boolean(row["aktif"]),
      createdAt: row["created_at"] as string,
    }))
  } catch {
    return []
  }
}

export async function createUserAction(
  data: Partial<UserAccount>
): Promise<UserAccount | null> {
  try {
    const client = getClient()
    const { data: result, error } = await client
      .from("users")
      .insert({
        email: data.email ?? "",
        nama: data.nama ?? "",
        role: data.role ?? "viewer",
        aktif: data.aktif ?? true,
      })
      .select()
      .single()

    if (error || !result) return null

    return {
      id: result.id,
      email: result.email,
      nama: result.nama,
      role: result.role as UserRole,
      aktif: result.aktif,
      createdAt: result.created_at,
    }
  } catch {
    return null
  }
}

export async function updateUserAction(
  id: string,
  data: Partial<UserAccount>
): Promise<UserAccount | null> {
  try {
    const client = getClient()
    const payload: Record<string, unknown> = {}

    if (data.email !== undefined) payload["email"] = data.email
    if (data.nama !== undefined) payload["nama"] = data.nama
    if (data.role !== undefined) payload["role"] = data.role
    if (data.aktif !== undefined) payload["aktif"] = data.aktif

    const { data: result, error } = await client
      .from("users")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null

    return {
      id: result.id,
      email: result.email,
      nama: result.nama,
      role: result.role as UserRole,
      aktif: result.aktif,
      createdAt: result.created_at,
    }
  } catch {
    return null
  }
}

export async function deleteUserAction(id: string): Promise<boolean> {
  try {
    const client = getClient()
    const { error } = await client.from("users").delete().eq("id", id)
    return !error
  } catch {
    return false
  }
}

// ─── Backup ───

export async function triggerBackupAction(type: BackupType): Promise<BackupRecord | null> {
  try {
    // Placeholder: actual backup integration with GDrive will be in Phase 5
    const record: BackupRecord = {
      id: `backup-${Date.now()}`,
      tipe: type,
      namaFile: `backup-${type}-${new Date().toISOString().split("T")[0]}`,
      ukuran: "0 MB",
      tanggal: new Date().toISOString().split("T")[0],
      status: "success",
    }

    // Store backup log in Supabase
    const client = getClient()
    await client.from("backupLogs").insert({
      id: record.id,
      tipe_backup: type,
      nama_file: record.namaFile,
      ukuran: record.ukuran,
      tanggal: record.tanggal,
      status: record.status,
    })

    return record
  } catch {
    return null
  }
}

export async function getBackupHistoryAction(): Promise<BackupRecord[]> {
  try {
    const client = getClient()
    const { data, error } = await client
      .from("backupLogs")
      .select("*")
      .order("tanggal", { ascending: false })
      .limit(50)

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => ({
      id: row["id"] as string,
      tipe: row["tipe_backup"] as BackupType,
      namaFile: row["nama_file"] as string,
      ukuran: row["ukuran"] as string,
      tanggal: row["tanggal"] as string,
      status: row["status"] as BackupRecord["status"],
    }))
  } catch {
    return []
  }
}
