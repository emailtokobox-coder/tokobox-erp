/**
 * @module inventory/services
 * Inventory services barrel export.
 */

export { buildStockMovements, enrichStockMovementsWithDates } from "./StockHistoryService"
export type { StockMovementRow } from "../types"

export { StockSaldoService } from "./StockSaldoService"
export type { SaldoSyncResult, MovementSummary } from "./StockSaldoService"
