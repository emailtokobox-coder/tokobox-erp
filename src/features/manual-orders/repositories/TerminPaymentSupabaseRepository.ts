/**
 * @module manual-orders/repositories/TerminPaymentSupabaseRepository
 * Supabase-backed TerminPaymentRepository implementation.
 *
 * Per PRD Section 5.17 (terminPayments table).
 */

import { SupabaseClient } from "@supabase/supabase-js"
import type { TerminPayment } from "../types/ManualOrder"
import type { TerminPaymentRepository } from "./TerminPaymentRepository"

// ─── TerminPaymentSupabaseRepository ───

export class TerminPaymentSupabaseRepository implements TerminPaymentRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async findByOrderId(manualOrderId: string): Promise<TerminPayment[]> {
    const { data, error } = await this.client
      .from("terminPayments")
      .select("*")
      .eq("manual_order_id", manualOrderId)
      .order("urutan")

    if (error || !data) return []
    return data.map(mapTerminPayment)
  }

  async findById(id: string): Promise<TerminPayment | null> {
    const { data, error } = await this.client
      .from("terminPayments")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapTerminPayment(data)
  }

  async create(data: Partial<TerminPayment>): Promise<TerminPayment> {
    const payload: Record<string, unknown> = {
      manual_order_id: data.manualOrderId,
      urutan: data.urutan ?? 1,
      tanggal_jatuh_tempo: data.tanggalJatuhTempo ?? "",
      persentase: data.persentase ?? 0,
      nominal: data.nominal ?? 0,
      metode_pembayaran: data.metodePembayaran ?? "cash",
      status: data.status ?? "Pending",
      konfirmasi_bukti: data.konfirmasiBukti ?? "",
      catatan: data.catatan ?? "",
    }

    const { data: result, error } = await this.client
      .from("terminPayments")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Gagal create termin payment: ${error.message}`)
    }

    return mapTerminPayment(result)
  }

  async update(id: string, data: Partial<TerminPayment>): Promise<TerminPayment | null> {
    const updatePayload: Record<string, unknown> = {}

    if (data.persentase !== undefined) updatePayload["persentase"] = data.persentase
    if (data.nominal !== undefined) updatePayload["nominal"] = data.nominal
    if (data.metodePembayaran) updatePayload["metode_pembayaran"] = data.metodePembayaran
    if (data.status) updatePayload["status"] = data.status
    if (data.konfirmasiBukti !== undefined) updatePayload["konfirmasi_bukti"] = data.konfirmasiBukti
    if (data.catatan !== undefined) updatePayload["catatan"] = data.catatan
    if (data.tanggalJatuhTempo) updatePayload["tanggal_jatuh_tempo"] = data.tanggalJatuhTempo

    const { data: result, error } = await this.client
      .from("terminPayments")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null
    return mapTerminPayment(result)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("terminPayments")
      .delete()
      .eq("id", id)

    if (error) return false
    return true
  }
}

// ─── Mapper: Raw → Domain ───

function mapTerminPayment(row: Record<string, any>): TerminPayment {
  return {
    id: row["id"],
    manualOrderId: row["manual_order_id"],
    urutan: row["urutan"],
    tanggalJatuhTempo: row["tanggal_jatuh_tempo"],
    persentase: row["persentase"],
    nominal: row["nominal"],
    metodePembayaran: row["metode_pembayaran"],
    status: row["status"],
    konfirmasiBukti: row["konfirmasi_bukti"],
    catatan: row["catatan"],
    createdAt: row["created_at"],
  }
}
