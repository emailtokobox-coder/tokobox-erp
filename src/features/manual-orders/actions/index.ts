/**
 * @module manual-orders/actions
 * Server Actions — bridge between UI components and ManualOrderRepositories.
 *
 * Types are re-exported from the dedicated types barrel:
 * @see ../types/index.ts
 */

"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import {
	ManualOrderSupabaseRepository,
	DpPaymentSupabaseRepository,
	TerminPaymentSupabaseRepository,
	ResiDataSupabaseRepository,
	WhatsAppLogSupabaseRepository,
} from "../repositories";
import type { ManualOrder, ManualOrderItem, DpPayment, TerminPayment, ResiData, WhatsAppLog } from "../types/ManualOrder";
import type { ManualOrderFilter } from "../types/ManualOrderFilter";
import type { WhatsAppType } from "../constants/manualOrderStatus";

// ─── Result Types ───

export interface ManualOrderListResult {
	orders: ManualOrder[];
	total: number;
	page: number;
	pageSize: number;
}

// ─── Supabase Instances ───

function orderRepo() {
  return new ManualOrderSupabaseRepository(createSupabaseClient())
}

function dpRepo() {
  return new DpPaymentSupabaseRepository(createSupabaseClient())
}

function terminRepo() {
  return new TerminPaymentSupabaseRepository(createSupabaseClient())
}

function resiRepo() {
  return new ResiDataSupabaseRepository(createSupabaseClient())
}

function waRepo() {
  return new WhatsAppLogSupabaseRepository(createSupabaseClient())
}

// ─── Server Actions ───

/**
 * Generate the next manual order number for today.
 * Format: MO-YYYYMMDD-### (e.g., MO-20260723-001)
 */
export async function getNextManualOrderNumber(): Promise<string> {
  try {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
    const prefix = `MO-${today}`

    const client = createSupabaseClient()
    const { data, error } = await client
      .from("manualOrders")
      .select("no_manual_order")
      .like("no_manual_order", `${prefix}-%`)
      .order("no_manual_order", { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return `${prefix}-001`
    }

    const lastNumber = data[0].no_manual_order
    const parts = lastNumber.split("-")
    const seq = parseInt(parts[parts.length - 1] || "0", 10) + 1
    return `${prefix}-${String(seq).padStart(3, "0")}`
  } catch {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
    return `MO-${today}-001`
  }
}

/**
 * Fetch manual orders with optional filters.
 * Returns paginated list of manual orders.
 */
export async function getManualOrdersAction(
  filter?: ManualOrderFilter
): Promise<ManualOrderListResult> {
  try {
    const repo = orderRepo()
    return await repo.findAll(filter)
  } catch {
    return { orders: [], total: 0, page: 1, pageSize: 20 }
  }
}

/**
 * Fetch a single manual order by ID with related data.
 * Returns order, items, DP payments, termin payments, resi data, and WhatsApp logs.
 */
export async function getManualOrderDetailAction(
  id: string
): Promise<{
  order: ManualOrder | null
  items: ManualOrderItem[]
  dpPayments: DpPayment[]
  terminPayments: TerminPayment[]
  resi: ResiData | null
  whatsappLogs: WhatsAppLog[]
}> {
  try {
    const order = await orderRepo().findById(id)
    if (!order) {
      return { order: null, items: [], dpPayments: [], terminPayments: [], resi: null, whatsappLogs: [] }
    }

    const [dpPayments, terminPayments, resiList, waLogs] = await Promise.all([
      dpRepo().findByOrderId(id),
      terminRepo().findByOrderId(id),
      resiRepo().findByOrderId(id),
      waRepo().findByOrderId(id),
    ])

    return {
      order,
      items: order.items ?? [],
      dpPayments,
      terminPayments,
      resi: resiList[0] ?? null,
      whatsappLogs: waLogs,
    }
  } catch {
    return { order: null, items: [], dpPayments: [], terminPayments: [], resi: null, whatsappLogs: [] }
  }
}

/**
 * Create a new manual order.
 * Auto-generates no_manual_order and tanggal if not provided.
 */
export async function createManualOrderAction(
  data: Partial<ManualOrder>
): Promise<ManualOrder | null> {
  try {
    // Auto-generate no_manual_order if not provided
    if (!data.noManualOrder) {
      data.noManualOrder = await getNextManualOrderNumber()
    }

    // Auto-generate tanggal if not provided
    if (!data.tanggal) {
      data.tanggal = new Date().toISOString().split("T")[0]
    }

    const repo = orderRepo()
    const order = await repo.create(data)

    // If order has DP or Termin schedule, insert payments
    if (order.tipePesanan === "MANUAL_DP" && data.dpPersentase) {
      await dpRepo().create({
        manualOrderId: order.id!,
        urutan: 1,
        tanggal: data.tanggal,
        persentase: data.dpPersentase,
        nominal: data.dpNominal ?? Math.round((order.total ?? 0) * data.dpPersentase / 100),
        metodePembayaran: data.metodePembayaran ?? "cash",
        status: "Pending",
      })
    }

    if (order.tipePesanan === "MANUAL_TERMIN" && data.terminSchedule && data.terminSchedule.length > 0) {
      for (let i = 0; i < data.terminSchedule.length; i++) {
        const schedule = data.terminSchedule[i]
        await terminRepo().create({
          manualOrderId: order.id!,
          urutan: i + 1,
          tanggalJatuhTempo: (schedule as { tanggalJatuhTempo?: string }).tanggalJatuhTempo ?? "",
          persentase: (schedule as { persentase?: number }).persentase ?? 0,
          nominal: (schedule as { nominal?: number }).nominal ?? 0,
          metodePembayaran: data.metodePembayaran ?? "cash",
          status: "Pending",
        })
      }
    }

    return order
  } catch {
    return null
  }
}

/**
 * Update an existing manual order.
 */
export async function updateManualOrderAction(
  id: string,
  data: Partial<ManualOrder>
): Promise<ManualOrder | null> {
  try {
    const repo = orderRepo()
    return await repo.update(id, data)
  } catch {
    return null
  }
}

/**
 * Delete a manual order by ID.
 * Cascading deletes handled by DB foreign key constraints.
 */
export async function deleteManualOrderAction(id: string): Promise<boolean> {
  try {
    const repo = orderRepo()
    return await repo.delete(id)
  } catch {
    return false
  }
}

/**
 * Send WhatsApp message for a manual order.
 * Logs the message to whatsappLogs table.
 */
export async function sendWhatsAppAction(
  id: string,
  _type: WhatsAppType
): Promise<boolean> {
  try {
    // Fetch order to get customer info
    const order = await orderRepo().findById(id)
    if (!order) return false

    // Determine message based on type
    const pesan = buildWhatsAppMessage(_type, order)

    // Log the WhatsApp message
    await waRepo().create({
      manualOrderId: id,
      tipe: _type,
      nomorWp: order.noHp,
      pesan,
      status: "Terkirim",
    })

    return true
  } catch {
    return false
  }
}

/**
 * Update DP payment status and confirmation proof.
 */
export async function updateDpPaymentStatusAction(
  id: string,
  status: DpPayment["status"],
  konfirmasiBukti?: string
): Promise<DpPayment | null> {
  try {
    const repo = dpRepo()
    const data: Partial<DpPayment> = { status }
    if (konfirmasiBukti !== undefined) data.konfirmasiBukti = konfirmasiBukti
    return await repo.update(id, data)
  } catch {
    return null
  }
}

/**
 * Update Termin payment status, confirmation proof, and note.
 */
export async function updateTerminPaymentStatusAction(
  id: string,
  status: TerminPayment["status"],
  konfirmasiBukti?: string,
  catatan?: string
): Promise<TerminPayment | null> {
  try {
    const repo = terminRepo()
    const data: Partial<TerminPayment> = { status }
    if (konfirmasiBukti !== undefined) data.konfirmasiBukti = konfirmasiBukti
    if (catatan !== undefined) data.catatan = catatan
    return await repo.update(id, data)
  } catch {
    return null
  }
}

/**
 * Add resi data for a manual order.
 */
export async function addResiDataAction(
  data: Partial<ResiData>
): Promise<ResiData | null> {
  try {
    const repo = resiRepo()
    return await repo.create(data)
  } catch {
    return null
  }
}

/**
 * Get WhatsApp logs for a manual order.
 */
export async function getWhatsAppLogsAction(
  orderId: string
): Promise<WhatsAppLog[]> {
  try {
    const repo = waRepo()
    return await repo.findByOrderId(orderId)
  } catch {
    return []
  }
}

// ─── Helpers ───

function buildWhatsAppMessage(type: WhatsAppType, order: ManualOrder): string {
  switch (type) {
    case "INVOICE":
      return `Halo ${order.namaPelanggan}, invoice pesanan ${order.noManualOrder} sebesar ${formatRupiah(order.total)}. Silakan melakukan pembayaran.`
    case "RESI":
      return `Halo ${order.namaPelanggan}, pesanan ${order.noManualOrder} telah dikirim.`
    case "PELUNASAN":
      return `Halo ${order.namaPelanggan}, kami mengingatkan pelunasan pesanan ${order.noManualOrder} sebesar ${formatRupiah(order.sisaPembayaran)}.`
    case "FOLLOW_UP":
      return `Halo ${order.namaPelanggan}, apakah ada yang bisa kami bantu untuk pesanan ${order.noManualOrder}?`
    case "DP_REQUEST":
      return `Halo ${order.namaPelanggan}, mohon pembayaran DP untuk pesanan ${order.noManualOrder}.`
    default:
      return `Pesan untuk pesanan ${order.noManualOrder}.`
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
