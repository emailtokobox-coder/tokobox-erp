/**
 * @module status-tracker/actions
 * Server Actions — fetch unified orders for the Status Tracker.
 *
 * Combines Shopee orders + manual orders into a single list for
 * kanban board and timeline display.
 */

import { getManualOrdersAction } from "@/features/manual-orders"
import { getOrdersAction } from "@/features/orders/actions"
import type { UnifiedOrder, StatusTrackerFilter } from "../types"
import { mapManualStatusToColumn, mapShopeeStatusToColumn } from "../constants/kanbanColumns"

// ─── Server Actions ───

/**
 * Fetch unified orders from both Shopee and Manual sources.
 * Merges results into a single list sorted by date desc.
 */
export async function getUnifiedOrdersAction(
  filter?: StatusTrackerFilter
): Promise<UnifiedOrder[]> {
  try {
    const results: UnifiedOrder[] = []

    // Fetch Shopee orders
    if (!filter?.source || filter.source === "shopee") {
      const shopeeFilter: Record<string, unknown> = { page: 1, pageSize: 100 }
      if (filter?.dateFrom) shopeeFilter["dateFrom"] = filter.dateFrom
      if (filter?.dateTo) shopeeFilter["dateTo"] = filter.dateTo
      if (filter?.status) shopeeFilter["statusOrderFinal"] = filter.status
      if (filter?.search) shopeeFilter["search"] = filter.search

      const shopeeResult = await getOrdersAction(shopeeFilter)
      for (const header of shopeeResult.headers) {
        results.push({
          id: String(header.id ?? ""),
          source: "shopee",
          noOrder: header.noPesanan,
          status: header.statusOrderFinal,
          columnId: mapShopeeStatusToColumn(header.statusOrderFinal),
          customer: header.usernamePembeli || "-",
          tanggal: header.waktuPesananDibuat,
          total: header.totalOmzetValid,
          itemCount: header.itemCount,
        })
      }
    }

    // Fetch manual orders
    if (!filter?.source || filter.source === "manual") {
      const manualFilter: Record<string, unknown> = { page: 1, pageSize: 100 }
      if (filter?.dateFrom) manualFilter["dateFrom"] = filter.dateFrom
      if (filter?.dateTo) manualFilter["dateTo"] = filter.dateTo
      if (filter?.status) manualFilter["status"] = filter.status
      if (filter?.search) manualFilter["search"] = filter.search

      const manualResult = await getManualOrdersAction(manualFilter as Parameters<typeof getManualOrdersAction>[0])
      for (const order of manualResult.orders) {
        results.push({
          id: order.id!,
          source: "manual",
          noOrder: order.noManualOrder,
          status: order.statusOrder,
          columnId: mapManualStatusToColumn(order.statusOrder),
          customer: order.namaPelanggan,
          tanggal: order.tanggal || order.createdAt,
          total: order.total,
          tipe: order.tipePesanan,
          itemCount: order.items?.length ?? 0,
        })
      }
    }

    // Sort by tanggal desc
    results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""))

    return results
  } catch {
    return []
  }
}
