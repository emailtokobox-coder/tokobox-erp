/**
 * @module orders/services
 * OrderSummaryService — orchestrates the full order processing pipeline.
 *
 * This is the main entry point for order business logic.
 * It coordinates domain functions, mappers, and repositories.
 *
 * Pipeline:
 *   1. Parse raw rows → OrderItem (via calculateItem)
 *   2. Build OrderHeader[] (via buildOrderHeaders)
 *   3. Match income (via matchIncome)
 *   4. Match adjustment (via matchAdjustment)
 *   5. Apply HPP (via applyHppToItems)
 *   6. Build HPP resolver (via buildHppResolver)
 *   7. Build dashboard summary (via buildSummary)
 */

import type { OrderItem, OrderHeader, IncomeRecord, AdjustmentRecord, HppSku, DashboardSummary, HppIssue } from "../types/OrderItem"
import { calculateItem, buildOrderHeaders, matchIncome, matchAdjustment, applyHppToItems, buildHppResolver, buildSummary } from "../domain/OrderCalculator"
import { OrderRepository } from "../repositories/OrderRepository"

// ─── Service Interface ───

export interface OrderSummaryService {
  // Processing pipeline
  processOrderItems(
    rawItems: Array<{
      noPesanan: string
      sku: string
      namaProduk: string
      namaVariasi: string
      hargaAsli: number
      hargaSetelahDiskon: number
      qtyOrder: number
      qtyReturn: number
      subtotalPesanan: number
      statusPesanan: string
      hppPerSku: number | null
    }>,
    storeId: string,
  ): Promise<{ items: OrderItem[]; headers: OrderHeader[] }>

  // Income & adjustment matching
  matchIncomeToOrders(headers: OrderHeader[], incomes: IncomeRecord[]): Promise<OrderHeader[]>
  matchAdjustmentToOrders(headers: OrderHeader[], adjustments: AdjustmentRecord[]): Promise<OrderHeader[]>

  // HPP operations
  applyHppMap(items: OrderItem[], hppMap: Map<string, HppSku>): Promise<OrderItem[]>
  resolveMissingHpp(items: OrderItem[]): Promise<HppIssue[]>

  // Dashboard
  buildDashboardSummary(headers: OrderHeader[]): Promise<DashboardSummary>

  // Persistence
  saveOrders(items: OrderItem[], headers: OrderHeader[]): Promise<void>
  loadOrders(): Promise<{ items: OrderItem[]; headers: OrderHeader[] }>
}

// ─── Implementation ───

export const orderSummaryService: OrderSummaryService = {
  async processOrderItems(rawItems, storeId) {
    const items: OrderItem[] = rawItems.map((raw) =>
      calculateItem(
        raw.noPesanan,
        raw.sku,
        raw.namaProduk,
        raw.namaVariasi,
        raw.hargaAsli,
        raw.hargaSetelahDiskon,
        raw.qtyOrder,
        raw.qtyReturn,
        raw.subtotalPesanan,
        raw.statusPesanan,
        raw.hppPerSku,
      )
    )
    const headers = buildOrderHeaders(items, storeId)
    return { items, headers }
  },

  async matchIncomeToOrders(headers, incomes) {
    return matchIncome(headers, incomes)
  },

  async matchAdjustmentToOrders(headers, adjustments) {
    return matchAdjustment(headers, adjustments)
  },

  async applyHppMap(items, hppMap) {
    return applyHppToItems(items, hppMap)
  },

  async resolveMissingHpp(items) {
    return buildHppResolver(items)
  },

  async buildDashboardSummary(headers) {
    return buildSummary(headers)
  },

  async saveOrders(items, headers) {
    await OrderRepository.insertItems(items)
    await OrderRepository.insertHeaders(headers)
  },

  async loadOrders() {
    const items = await OrderRepository.findItems()
    const headers = await OrderRepository.findHeaders()
    return { items, headers }
  },
}
