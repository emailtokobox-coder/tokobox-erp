/**
 * @module manual-orders/repositories/WhatsAppLogSupabaseRepository
 * Supabase-backed WhatsAppLogRepository implementation.
 *
 * Per PRD Section 5.19 (whatsappLogs table).
 */

import { SupabaseClient } from "@supabase/supabase-js"
import type { WhatsAppLog } from "../types/ManualOrder"
import type { WhatsAppLogRepository } from "./WhatsAppLogRepository"

// ─── WhatsAppLogSupabaseRepository ───

export class WhatsAppLogSupabaseRepository implements WhatsAppLogRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async findByOrderId(manualOrderId: string): Promise<WhatsAppLog[]> {
    const { data, error } = await this.client
      .from("whatsappLogs")
      .select("*")
      .eq("manual_order_id", manualOrderId)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return data.map(mapWhatsAppLog)
  }

  async findById(id: string): Promise<WhatsAppLog | null> {
    const { data, error } = await this.client
      .from("whatsappLogs")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapWhatsAppLog(data)
  }

  async create(data: Partial<WhatsAppLog>): Promise<WhatsAppLog> {
    const payload: Record<string, unknown> = {
      manual_order_id: data.manualOrderId,
      tipe: data.tipe ?? "FOLLOW_UP",
      nomor_wp: data.nomorWp,
      pesan: data.pesan,
      status: data.status ?? "Terkirim",
    }

    const { data: result, error } = await this.client
      .from("whatsappLogs")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Gagal create WhatsApp log: ${error.message}`)
    }

    return mapWhatsAppLog(result)
  }
}

// ─── Mapper: Raw → Domain ───

function mapWhatsAppLog(row: Record<string, any>): WhatsAppLog {
  return {
    id: row["id"],
    manualOrderId: row["manual_order_id"],
    tipe: row["tipe"],
    nomorWp: row["nomor_wp"],
    pesan: row["pesan"],
    status: row["status"],
    createdAt: row["created_at"],
  }
}
