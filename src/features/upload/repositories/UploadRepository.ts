/**
 * @module upload/repositories
 * UploadRepository — data access layer for import operations.
 *
 * Handles bulk inserts for orders, income, adjustments, HPP, and grosir.
 * All operations are designed to work within a DbTransaction for atomicity.
 *
 * Architecture:
 *   UI → Actions → Services → Repositories → DbTransaction → Supabase
 */

import type { OrderHeader, OrderItem } from "../../orders/types/OrderItem"
import type { OrderItemProcessed, OrderHeaderProcessed } from "../types"
import type { IncomeRow, AdjustmentRow, HppRow, GrosirRow } from "@/lib/xlsx"

/* ─── Repository Interface ─── */

export interface UploadRepository {
  // Orders
  bulkInsertOrderHeaders(headers: OrderHeaderProcessed[]): Promise<OrderHeader[]>
  bulkInsertOrderItems(items: OrderItemProcessed[]): Promise<OrderItem[]>

  // Income
  bulkInsertIncome(rows: IncomeRow[]): Promise<IncomeRow[]>

  // Adjustments
  bulkInsertAdjustments(rows: AdjustmentRow[]): Promise<AdjustmentRow[]>

  // HPP
  bulkInsertHpp(rows: HppRow[]): Promise<HppRow[]>

  // Grosir
  bulkInsertGrosir(rows: GrosirRow[]): Promise<GrosirRow[]>

  // Exists checks (for idempotency)
  findIncomeByNoPesanan(noPesanan: string): Promise<IncomeRow | null>
  findHppBySku(sku: string): Promise<HppRow | null>
  findGrosirBySku(sku: string): Promise<GrosirRow[]>
}
