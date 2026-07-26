/**
 * @module supplier
 * Supplier — CRUD, price history, PO suggestions.
 *
 * Per PRD 5.13, 5.14:
 *   - suppliers table: CRUD for supplier master data
 *   - supplierPrices table: price history per supplier per base_product
 *
 * Architecture:
 *   Page (server) → actions → Supabase tables (suppliers, supplierPrices)
 */

// Types
export type { Supplier, SupplierPrice, SupplierFilter, SupplierFormData } from "./types"

// Actions
export {
  getSuppliersAction,
  getSupplierAction,
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  getSupplierPricesAction,
  createSupplierPriceAction,
} from "./actions"

// Components
export { SupplierTable, SupplierForm, SupplierDetail } from "./components"
