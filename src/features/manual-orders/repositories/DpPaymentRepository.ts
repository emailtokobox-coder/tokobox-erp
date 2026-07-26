/**
 * @module manual-orders/repositories/DpPaymentRepository
 * Repository interface + in-memory stub for dpPayments table.
 *
 * Per PRD Section 5.16 (dpPayments table).
 */

import type { DpPayment } from "../types/ManualOrder"

// ─── In-memory store ───

const dpStore: DpPayment[] = []

// ─── Repository Interface ───

export interface DpPaymentRepository {
  findByOrderId(manualOrderId: string): Promise<DpPayment[]>
  findById(id: string): Promise<DpPayment | null>
  create(data: Partial<DpPayment>): Promise<DpPayment>
  update(id: string, data: Partial<DpPayment>): Promise<DpPayment | null>
  delete(id: string): Promise<boolean>
}

// ─── Stub Implementation ───

export const DpPaymentRepository: DpPaymentRepository = {
  async findByOrderId(manualOrderId: string): Promise<DpPayment[]> {
    return dpStore.filter((p) => p.manualOrderId === manualOrderId).sort((a, b) => a.urutan - b.urutan)
  },

  async findById(id: string): Promise<DpPayment | null> {
    return dpStore.find((p) => p.id === id) ?? null
  },

  async create(data: Partial<DpPayment>): Promise<DpPayment> {
    const payment: DpPayment = {
      manualOrderId: data.manualOrderId ?? "",
      urutan: data.urutan ?? 1,
      tanggal: data.tanggal ?? "",
      persentase: data.persentase ?? 0,
      nominal: data.nominal ?? 0,
      metodePembayaran: data.metodePembayaran ?? "cash",
      konfirmasiBukti: data.konfirmasiBukti ?? "",
      status: data.status ?? "Pending",
      createdAt: new Date().toISOString(),
    } as DpPayment
    dpStore.push(payment)
    return payment
  },

  async update(id: string, data: Partial<DpPayment>): Promise<DpPayment | null> {
    const idx = dpStore.findIndex((p) => p.id === id)
    if (idx === -1) return null
    dpStore[idx] = { ...dpStore[idx], ...data, createdAt: dpStore[idx].createdAt }
    return dpStore[idx]
  },

  async delete(id: string): Promise<boolean> {
    const idx = dpStore.findIndex((p) => p.id === id)
    if (idx === -1) return false
    dpStore.splice(idx, 1)
    return true
  },
}
