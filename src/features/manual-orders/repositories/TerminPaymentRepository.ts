/**
 * @module manual-orders/repositories/TerminPaymentRepository
 * Repository interface + in-memory stub for terminPayments table.
 *
 * Per PRD Section 5.17 (terminPayments table).
 */

import type { TerminPayment } from "../types/ManualOrder"

// ─── In-memory store ───

const terminStore: TerminPayment[] = []

// ─── Repository Interface ───

export interface TerminPaymentRepository {
  findByOrderId(manualOrderId: string): Promise<TerminPayment[]>
  findById(id: string): Promise<TerminPayment | null>
  create(data: Partial<TerminPayment>): Promise<TerminPayment>
  update(id: string, data: Partial<TerminPayment>): Promise<TerminPayment | null>
  delete(id: string): Promise<boolean>
}

// ─── Stub Implementation ───

export const TerminPaymentRepository: TerminPaymentRepository = {
  async findByOrderId(manualOrderId: string): Promise<TerminPayment[]> {
    return terminStore.filter((p) => p.manualOrderId === manualOrderId).sort((a, b) => a.urutan - b.urutan)
  },

  async findById(id: string): Promise<TerminPayment | null> {
    return terminStore.find((p) => p.id === id) ?? null
  },

  async create(data: Partial<TerminPayment>): Promise<TerminPayment> {
    const payment: TerminPayment = {
      manualOrderId: data.manualOrderId ?? "",
      urutan: data.urutan ?? 1,
      tanggalJatuhTempo: data.tanggalJatuhTempo ?? "",
      persentase: data.persentase ?? 0,
      nominal: data.nominal ?? 0,
      metodePembayaran: data.metodePembayaran ?? "cash",
      status: data.status ?? "Pending",
      konfirmasiBukti: data.konfirmasiBukti ?? "",
      catatan: data.catatan ?? "",
      createdAt: new Date().toISOString(),
    } as TerminPayment
    terminStore.push(payment)
    return payment
  },

  async update(id: string, data: Partial<TerminPayment>): Promise<TerminPayment | null> {
    const idx = terminStore.findIndex((p) => p.id === id)
    if (idx === -1) return null
    terminStore[idx] = { ...terminStore[idx], ...data, createdAt: terminStore[idx].createdAt }
    return terminStore[idx]
  },

  async delete(id: string): Promise<boolean> {
    const idx = terminStore.findIndex((p) => p.id === id)
    if (idx === -1) return false
    terminStore.splice(idx, 1)
    return true
  },
}
