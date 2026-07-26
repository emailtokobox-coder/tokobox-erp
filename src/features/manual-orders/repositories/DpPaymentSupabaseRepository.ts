/**
 * @module manual-orders/repositories/DpPaymentSupabaseRepository
 * Supabase-backed DpPaymentRepository implementation.
 *
 * Per PRD Section 5.16 (dpPayments table).
 */

import { SupabaseClient } from "@supabase/supabase-js"
import type { DpPayment } from "../types/ManualOrder"
import type { DpPaymentRepository } from "./DpPaymentRepository"

// ─── DpPaymentSupabaseRepository ───

export class DpPaymentSupabaseRepository implements DpPaymentRepository {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async findByOrderId(manualOrderId: string): Promise<DpPayment[]> {
    const { data, error } = await this.client
      .from("dpPayments")
      .select("*")
      .eq("manual_order_id", manualOrderId)
      .order("urutan")

    if (error || !data) return []
    return data.map(mapDpPayment)
  }

  async findById(id: string): Promise<DpPayment | null> {
    const { data, error } = await this.client
      .from("dpPayments")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) return null
    return mapDpPayment(data)
  }

  async create(data: Partial<DpPayment>): Promise<DpPayment> {
    const payload: Record<string, unknown> = {
      manual_order_id: data.manualOrderId,
      urutan: data.urutan ?? 1,
      tanggal: data.tanggal ?? "",
      persentase: data.persentase ?? 0,
      nominal: data.nominal ?? 0,
      metode_pembayaran: data.metodePembayaran ?? "cash",
      konfirmasi_bukti: data.konfirmasiBukti ?? "",
      status: data.status ?? "Pending",
    }

    const { data: result, error } = await this.client
      .from("dpPayments")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new Error(`Gagal create DP payment: ${error.message}`)
    }

    return mapDpPayment(result)
  }

  async update(id: string, data: Partial<DpPayment>): Promise<DpPayment | null> {
    const updatePayload: Record<string, unknown> = {}

    if (data.persentase !== undefined) updatePayload["persentase"] = data.persentase
    if (data.nominal !== undefined) updatePayload["nominal"] = data.nominal
    if (data.metodePembayaran) updatePayload["metode_pembayaran"] = data.metodePembayaran
    if (data.konfirmasiBukti !== undefined) updatePayload["konfirmasi_bukti"] = data.konfirmasiBukti
    if (data.status) updatePayload["status"] = data.status
    if (data.tanggal) updatePayload["tanggal"] = data.tanggal

    const { data: result, error } = await this.client
      .from("dpPayments")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) return null
    return mapDpPayment(result)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("dpPayments")
      .delete()
      .eq("id", id)

    if (error) return false
    return true
  }
}

// ─── Mapper: Raw → Domain ───

function mapDpPayment(row: Record<string, any>): DpPayment {
  return {
    id: row["id"],
    manualOrderId: row["manual_order_id"],
    urutan: row["urutan"],
    tanggal: row["tanggal"],
    persentase: row["persentase"],
    nominal: row["nominal"],
    metodePembayaran: row["metode_pembayaran"],
    konfirmasiBukti: row["konfirmasi_bukti"],
    status: row["status"],
    createdAt: row["created_at"],
  }
}
