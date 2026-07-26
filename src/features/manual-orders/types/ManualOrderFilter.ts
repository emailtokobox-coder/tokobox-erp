/**
 * @module manual-orders/types
 * Filter parameter types for Manual Orders.
 */

import type { ManualOrderType, ManualOrderStatus } from "../constants/manualOrderStatus"

export interface ManualOrderFilter {
  page?: number
  pageSize?: number
  storeId?: string
  tipe?: ManualOrderType
  status?: ManualOrderStatus
  search?: string
  dateFrom?: string
  dateTo?: string
}
