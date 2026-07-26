/**
 * @module manual-orders/repositories/ResiDataSupabaseRepository
 * Supabase-backed ResiDataRepository implementation.
 *
 * Per PRD Section 5.18 (resiData table).
 */

import { SupabaseClient } from "@supabase/supabase-js"
import type { ResiData } from "../types/ManualOrder"
import type { ResiDataRepository } from "./ResiDataRepository"

// ─── ResiDataSupabaseRepository ───

export class ResiDataSupabaseRepository implements ResiDataRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async findByOrderId(manualOrderId: string): Promise<ResiData[]> {
    const { data, error } = await this.client
      .from("resiData")
      .select("*")
      .eq("manual_order_id", manualOrderId)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return data.map(mapResiData)
  }

  async findById(id: string): Promise<ResiData | null> {
    const { data, error } = await this.client
      .from("resiData")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapResiData(data)
  }

  async findByNoResi(noResi: string): Promise<ResiData | null> {
    const { data, error } = await this.client
      .from("resiData")
      .select("*")
      .eq("no_resi", noResi)
      .single()

    if (error || !data) return null
    return mapResiData(data)
  }

  async create(data: Partial<ResiData>): Promise<ResiData> {
    const payload: Record<string, unknown> = {
      manual_order_id: data.manualOrderId,
      no_resi: data.noResi,
      ekspedisi: data.ekspedisi,
      tanggal_kirim: data.tanggalKirim ?? new Date().toISOString().split("T")[0],
      bukti_foto: data.buktiFoto ?? "",
      resi_terkirim_wp: data.resiTerkirimWp ?? false,
    }

    const { data: result, error } = await this.client
      .from("resiData")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Gagal create resi data: ${error.message}`)
    }

    return mapResiData(result)
  }

  async update(id: string, data: Partial<ResiData>): Promise<ResiData | null> {
    const updatePayload: Record<string, unknown> = {}

    if (data.noResi) updatePayload["no_resi"] = data.noResi
    if (data.ekspedisi !== undefined) updatePayload["ekspedisi"] = data.ekspedisi
    if (data.tanggalKirim) updatePayload["tanggal_kirim"] = data.tanggalKirim
    if (data.buktiFoto !== undefined) updatePayload["bukti_foto"] = data.buktiFoto
    if (data.resiTerkirimWp !== undefined) updatePayload["resi_terkirim_wp"] = data.resiTerkirimWp

    const { data: result, error } = await this.client
      .from("resiData")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null
    return mapResiData(result)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("resiData")
      .delete()
      .eq("id", id)

    if (error) return false
    return true
  }
}

// ─── Mapper: Raw → Domain ───

function mapResiData(row: Record<string, any>): ResiData {
  return {
    id: row["id"],
    manualOrderId: row["manual_order_id"],
    noResi: row["no_resi"],
    ekspedisi: row["ekspedisi"],
    tanggalKirim: row["tanggal_kirim"],
    buktiFoto: row["bukti_foto"],
    resiTerkirimWp: row["resi_terkirim_wp"],
    createdAt: row["created_at"],
  }
}
