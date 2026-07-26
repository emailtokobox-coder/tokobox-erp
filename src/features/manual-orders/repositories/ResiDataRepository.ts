/**
 * @module manual-orders/repositories/ResiDataRepository
 * Repository interface + in-memory stub for resiData table.
 *
 * Per PRD Section 5.18 (resiData table).
 */

import type { ResiData } from "../types/ManualOrder"

// ─── In-memory store ───

const resiStore: ResiData[] = []

// ─── Repository Interface ───

export interface ResiDataRepository {
  findByOrderId(manualOrderId: string): Promise<ResiData[]>
  findById(id: string): Promise<ResiData | null>
  findByNoResi(noResi: string): Promise<ResiData | null>
  create(data: Partial<ResiData>): Promise<ResiData>
  update(id: string, data: Partial<ResiData>): Promise<ResiData | null>
  delete(id: string): Promise<boolean>
}

// ─── Stub Implementation ───

export const ResiDataRepository: ResiDataRepository = {
  async findByOrderId(manualOrderId: string): Promise<ResiData[]> {
    return resiStore.filter((r) => r.manualOrderId === manualOrderId)
  },

  async findById(id: string): Promise<ResiData | null> {
    return resiStore.find((r) => r.id === id) ?? null
  },

  async findByNoResi(noResi: string): Promise<ResiData | null> {
    return resiStore.find((r) => r.noResi === noResi) ?? null
  },

  async create(data: Partial<ResiData>): Promise<ResiData> {
    const resi: ResiData = {
      manualOrderId: data.manualOrderId ?? "",
      noResi: data.noResi ?? "",
      ekspedisi: data.ekspedisi ?? "",
      tanggalKirim: data.tanggalKirim ?? "",
      buktiFoto: data.buktiFoto ?? "",
      resiTerkirimWp: data.resiTerkirimWp ?? false,
      createdAt: new Date().toISOString(),
    } as ResiData
    resiStore.push(resi)
    return resi
  },

  async update(id: string, data: Partial<ResiData>): Promise<ResiData | null> {
    const idx = resiStore.findIndex((r) => r.id === id)
    if (idx === -1) return null
    resiStore[idx] = { ...resiStore[idx], ...data, createdAt: resiStore[idx].createdAt }
    return resiStore[idx]
  },

  async delete(id: string): Promise<boolean> {
    const idx = resiStore.findIndex((r) => r.id === id)
    if (idx === -1) return false
    resiStore.splice(idx, 1)
    return true
  },
}
