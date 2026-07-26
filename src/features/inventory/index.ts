/**
 * @module inventory
 * Inventory & HPP — HPP management, stock saldo, stock movements, HPP resolver.
 *
 * Per PRD 7.4:
 *   - HPP per SKU (table + CRUD)
 *   - Stock Saldo
 *   - Stock Movement tracking
 *   - HPP Resolver (SKU without HPP)
 *
 * Architecture:
 *   Page (server) → actions → Supabase tables
 *   Components (client) → actions → Supabase
 */

// Types
export type { HppSku, StockMovement, StockSaldo, StockAlert, StockOpname, StockOpnameItem, HppIssue, InventoryFilter } from "./types"

// Actions
export { getHppListAction, saveHppAction, deleteHppAction, getStockSaldoAction, updateStockSaldoAction, getStockMovementsAction, createStockMovementAction, getHppResolverAction } from "./actions"

// Components
export { HppTable, StockSaldoTable, StockMovementTable, HppResolverTable } from "./components"
