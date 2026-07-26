/**
 * @module manual-orders
 * Manual Orders — CRUD, detail view, WhatsApp integration, payment tracking, service layer.
 *
 * Dependency graph:
 *    domain ← mappers ← repositories ← services ← actions ← hooks ← components
 */

// Types
export type { ManualOrder, ManualOrderItem, DpPayment, TerminPayment, ResiData, WhatsAppLog } from "./types/ManualOrder"
export type { ManualOrderFilter } from "./types/ManualOrderFilter"
export type { ManualOrderType, ManualOrderStatus, PaymentMethod, WhatsAppType } from "./constants/manualOrderStatus"

// Constants
export { MANUAL_ORDER_TYPES, MANUAL_ORDER_STATUSES, PAYMENT_METHODS, MANUAL_ORDER_ROUTES } from "./constants/manualOrderStatus"
export { getStatusFlow, getNextStatuses, canTransition, getStatusLabel } from "./constants/manualOrderStatus"

// Components
export { ManualOrdersTable, ManualOrderDetail, ManualOrderForm, StatusFlow, PaymentTracking } from "./components"

// Repositories (stubs + Supabase implementations)
export type { ManualOrderRepository } from "./repositories/ManualOrderRepository"
export type { DpPaymentRepository } from "./repositories/DpPaymentRepository"
export type { TerminPaymentRepository } from "./repositories/TerminPaymentRepository"
export type { ResiDataRepository } from "./repositories/ResiDataRepository"
export type { WhatsAppLogRepository } from "./repositories/WhatsAppLogRepository"
export { ManualOrderSupabaseRepository } from "./repositories/ManualOrderSupabaseRepository"
export { DpPaymentSupabaseRepository } from "./repositories/DpPaymentSupabaseRepository"
export { TerminPaymentSupabaseRepository } from "./repositories/TerminPaymentSupabaseRepository"
export { ResiDataSupabaseRepository } from "./repositories/ResiDataSupabaseRepository"
export { WhatsAppLogSupabaseRepository } from "./repositories/WhatsAppLogSupabaseRepository"

// Services
export { manualOrderService } from "./services"
export type { ValidationResult, OrderCalculation, OrderBuildResult, TerminScheduleEntry } from "./services"

// Schemas
export {
  manualOrderSchema,
  partialManualOrderSchema,
  manualOrderItemSchema,
  terminScheduleEntrySchema,
  parseWithErrors,
} from "./schemas"
export type { ValidationError } from "./schemas"

// Actions
export {
  getManualOrdersAction,
  getManualOrderDetailAction,
  createManualOrderAction,
  updateManualOrderAction,
  deleteManualOrderAction,
  sendWhatsAppAction,
  updateDpPaymentStatusAction,
  updateTerminPaymentStatusAction,
  addResiDataAction,
  getWhatsAppLogsAction,
  type ManualOrderListResult,
} from "./actions/index"
