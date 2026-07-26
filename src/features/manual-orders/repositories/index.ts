/**
 * @module manual-orders/repositories
 * Barrel export for Manual Orders repositories.
 *
 * Exports both in-memory stubs (for development) and Supabase implementations.
 */

// In-memory stubs
export { ManualOrderRepository } from "./ManualOrderRepository"
export { DpPaymentRepository } from "./DpPaymentRepository"
export { TerminPaymentRepository } from "./TerminPaymentRepository"
export { ResiDataRepository } from "./ResiDataRepository"
export { WhatsAppLogRepository } from "./WhatsAppLogRepository"

// Supabase implementations
export { ManualOrderSupabaseRepository } from "./ManualOrderSupabaseRepository"
export { DpPaymentSupabaseRepository } from "./DpPaymentSupabaseRepository"
export { TerminPaymentSupabaseRepository } from "./TerminPaymentSupabaseRepository"
export { ResiDataSupabaseRepository } from "./ResiDataSupabaseRepository"
export { WhatsAppLogSupabaseRepository } from "./WhatsAppLogSupabaseRepository"
