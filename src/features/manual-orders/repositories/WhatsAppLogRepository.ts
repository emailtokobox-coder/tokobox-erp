/**
 * @module manual-orders/repositories/WhatsAppLogRepository
 * Repository interface + in-memory stub for whatsappLogs table.
 *
 * Per PRD Section 5.19 (whatsappLogs table).
 */

import type { WhatsAppLog } from "../types/ManualOrder"

// ─── In-memory store ───

const waStore: WhatsAppLog[] = []

// ─── Repository Interface ───

export interface WhatsAppLogRepository {
  findByOrderId(manualOrderId: string): Promise<WhatsAppLog[]>
  findById(id: string): Promise<WhatsAppLog | null>
  create(data: Partial<WhatsAppLog>): Promise<WhatsAppLog>
}

// ─── Stub Implementation ───

export const WhatsAppLogRepository: WhatsAppLogRepository = {
  async findByOrderId(manualOrderId: string): Promise<WhatsAppLog[]> {
    return waStore.filter((l) => l.manualOrderId === manualOrderId).sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    )
  },

  async findById(id: string): Promise<WhatsAppLog | null> {
    return waStore.find((l) => l.id === id) ?? null
  },

  async create(data: Partial<WhatsAppLog>): Promise<WhatsAppLog> {
    const log: WhatsAppLog = {
      manualOrderId: data.manualOrderId ?? "",
      tipe: data.tipe ?? "FOLLOW_UP",
      nomorWp: data.nomorWp ?? "",
      pesan: data.pesan ?? "",
      status: data.status ?? "Terkirim",
      createdAt: new Date().toISOString(),
    } as WhatsAppLog
    waStore.push(log)
    return log
  },
}
