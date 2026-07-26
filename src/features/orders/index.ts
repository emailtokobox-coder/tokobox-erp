/**
 * @module orders
 * Order management — import, listing, detail, status tracking.
 *
 * Dependency graph:
 *   domain ← mappers ← repositories ← services ← actions ← hooks ← components
 */

// Types
export type { OrderItem } from "./types/OrderItem"
export type { OrderFilter } from "./types/OrderFilter"

// Domain
export type { OrderStatusItem, OrderStatusFinal, OrderStatusIncome, OrderStatusProfit, OrderStatusHpp } from "./domain/OrderStatus"
export { calculateItem, buildOrderHeaders, matchIncome, matchAdjustment, applyHppToItems, buildHppResolver, buildSummary } from "./domain/OrderCalculator"

// Constants
export { ORDER_STATUSES } from "./constants/orderStatus"
export { ORDER_ROUTES } from "./constants/orderRoutes"

// Utils
export { generateOrderId } from "./utils/orderHelpers"

// Mappers
export { mapOrderItem, mapOrderItems } from "./mappers/OrderItemMapper"
export { mapOrderHeader, mapOrderHeaders } from "./mappers/OrderMapper"

// Repositories
export { OrderRepository } from "./repositories/OrderRepository"

// Components
export { OrderListTable, OrderDetailTable } from "./components"

// Actions
export { getOrdersAction, getOrderDetailAction, createOrderAction, deleteOrderAction } from "./actions/index"

// Services
export { orderSummaryService, type OrderSummaryService } from "./services/OrderSummaryService"
