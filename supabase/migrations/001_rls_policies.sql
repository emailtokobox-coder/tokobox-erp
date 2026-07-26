-- =========================================================
-- TokoBox ERP — RLS Policies Migration (Phase 9 Deploy Prep)
-- Table list from PRD Section 5
-- All tables enable RLS and enforce store-level isolation
-- =========================================================

-- Enable RLS on all tables that contain store_id (FK to stores)
ALTER TABLE orderHeaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderItems ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hppSkus ENABLE ROW LEVEL SECURITY;
ALTER TABLE grosirHarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockMovements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockAlerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockOpname ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockSaldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplierPrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE manualOrders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpPayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminPayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resiData ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsappLogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE importLogs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Order Headers (orderHeaders) — write + read per store
-- =================================================--------
CREATE POLICY "orderHeaders_access_store" ON orderHeaders
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "orderHeaders_insert_store" ON orderHeaders
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "orderHeaders_update_store" ON orderHeaders
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Order Items (orderItems)
-- =========================================================
CREATE POLICY "orderItems_access_store" ON orderItems
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "orderItems_insert_store" ON orderItems
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "orderItems_update_store" ON orderItems
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Incomes (incomes)
-- =========================================================
CREATE POLICY "incomes_access_store" ON incomes
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "incomes_insert_store" ON incomes
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "incomes_update_store" ON incomes
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Adjustments (adjustments)
-- =========================================================
CREATE POLICY "adjustments_access_store" ON adjustments
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "adjustments_insert_store" ON adjustments
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "adjustments_update_store" ON adjustments
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- HPP SKUs (hppSkus)
-- =========================================================
CREATE POLICY "hppSkus_access_store" ON hppSkus
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "hppSkus_insert_store" ON hppSkus
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "hppSkus_update_store" ON hppSkus
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Wholesale Prices (grosirHarga)
-- =========================================================
CREATE POLICY "grosirHarga_access_store" ON grosirHarga
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "grosirHarga_insert_store" ON grosirHarga
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "grosirHarga_update_store" ON grosirHarga
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Stock Movements (stockMovements)
-- =========================================================
CREATE POLICY "stockMovements_access_store" ON stockMovements
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "stockMovements_insert_store" ON stockMovements
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "stockMovements_update_store" ON stockMovements
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Stock Alerts (stockAlerts)
-- =========================================================
CREATE POLICY "stockAlerts_access_store" ON stockAlerts
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "stockAlerts_insert_store" ON stockAlerts
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "stockAlerts_update_store" ON stockAlerts
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Stock Opname (stockOpname)
-- =========================================================
CREATE POLICY "stockOpname_access_store" ON stockOpname
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "stockOpname_insert_store" ON stockOpname
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "stockOpname_update_store" ON stockOpname
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Stock Balance (stockSaldo)
-- =========================================================
CREATE POLICY "stockSaldo_access_store" ON stockSaldo
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "stockSaldo_insert_store" ON stockSaldo
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "stockSaldo_update_store" ON stockSaldo
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Settings (settings)
-- =========================================================
CREATE POLICY "settings_access_store" ON settings
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "settings_insert_store" ON settings
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "settings_update_store" ON settings
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Suppliers (suppliers)
-- =========================================================
CREATE POLICY "suppliers_access_store" ON suppliers
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "suppliers_insert_store" ON suppliers
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "suppliers_update_store" ON suppliers
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Supplier Prices (supplierPrices)
-- =========================================================
CREATE POLICY "supplierPrices_access_store" ON supplierPrices
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "supplierPrices_insert_store" ON supplierPrices
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "supplierPrices_update_store" ON supplierPrices
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Manual Orders (manualOrders)
-- =========================================================
CREATE POLICY "manualOrders_access_store" ON manualOrders
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "manualOrders_insert_store" ON manualOrders
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "manualOrders_update_store" ON manualOrders
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Down Payments (dpPayments)
-- =========================================================
CREATE POLICY "dpPayments_access_store" ON dpPayments
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "dpPayments_insert_store" ON dpPayments
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "dpPayments_update_store" ON dpPayments
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Installment Payments (terminPayments)
-- =========================================================
CREATE POLICY "terminPayments_access_store" ON terminPayments
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "terminPayments_insert_store" ON terminPayments
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "terminPayments_update_store" ON terminPayments
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Shipping Info (resiData)
-- =========================================================
CREATE POLICY "resiData_access_store" ON resiData
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "resiData_insert_store" ON resiData
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "resiData_update_store" ON resiData
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- WhatsApp Logs (whatsappLogs)
-- =========================================================
CREATE POLICY "whatsappLogs_access_store" ON whatsappLogs
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "whatsappLogs_insert_store" ON whatsappLogs
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "whatsappLogs_update_store" ON whatsappLogs
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Invoices (invoices)
-- =========================================================
CREATE POLICY "invoices_access_store" ON invoices
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "invoices_insert_store" ON invoices
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "invoices_update_store" ON invoices
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- =========================================================
-- Import Logs (importLogs)
-- =========================================================
CREATE POLICY "importLogs_access_store" ON importLogs
  FOR ALL USING (store_id = auth.uid()::TEXT);

CREATE POLICY "importLogs_insert_store" ON importLogs
  FOR INSERT WITH CHECK (store_id = auth.uid()::TEXT);

CREATE POLICY "importLogs_update_store" ON importLogs
  FOR UPDATE USING (store_id = auth.uid()::TEXT);

-- Note: Stores table also needs RLS — each user can only manage
-- their own store records. Assuming user_id references auth.uid():
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_access_store" ON stores
  FOR ALL USING (id = auth.uid()::TEXT);
CREATE POLICY "stores_insert_store" ON stores
  FOR INSERT WITH CHECK (id = auth.uid()::TEXT);
CREATE POLICY "stores_update_store" ON stores
  FOR UPDATE USING (id = auth.uid()::TEXT);
