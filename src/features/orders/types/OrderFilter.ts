/**
 * @module orders/types
 * OrderFilter — filter parameters for order queries.
 */

export interface OrderFilter {
  storeId?: string
  noPesanan?: string
  statusOrderFinal?: string
  statusItem?: string
  statusHpp?: string
  statusIncome?: string
  search?: string // noPesanan, namaProduk, sku
  dateFrom?: string // ISO date
  dateTo?: string // ISO date
  page?: number
  pageSize?: number
}
