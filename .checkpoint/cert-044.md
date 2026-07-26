# Cert-044 — Iter 44: Automatic Daily Stock History

**Iteration:** Iter 44  
**Phase:** Phase 5: Supplier + PO Pages  
**Status:** Complete  
**Date:** 2026-07-25  
**Build:** `tsc --noEmit` passed (zero errors)

---

## Scope

### New Files Created (2)

| File | Purpose |
|---|---|
| `src/features/inventory/services/StockHistoryService.ts` | Generates stock movement records from processed order items |
| `src/features/inventory/components/StockMovementTable.tsx` | Filterable table displaying stock movement history with MASUK/KELUAR badges |

### Files Modified (10)

| File | Change |
|---|---|
| `src/features/upload/services/ImportOrchestrator.ts` | Added stock movements generation + insertion into transaction pipeline; added `stockMovements` to `OrchestratorResult` type; updated all error paths |
| `src/features/upload/services/ImportOrderService.ts` | Carries `waktuPesananDibuat` through `processItem` → `OrderItemProcessed`; passes it to `processHeader` → `buildHeaders` for date mapping |
| `src/lib/database/transaction.ts` | Added `insertStockMovements()` method for atomic DB insert within existing transaction |
| `src/features/upload/types.ts` | Added `waktuPesananDibuat?` field to `OrderItemProcessed` and `OrderHeaderProcessed` interfaces |
| `app/(dashboard)/inventori/page.tsx` | Wired up "Pergerakan Stok" tab with `StockMovementTable` + `getStockMovementsAction` |
| `src/features/inventory/components/index.ts` | Barrel export: added `StockMovementTable` |
| `src/features/inventory/index.ts` | Barrel export: added `StockMovementTable` to feature index |
| `src/features/inventory/services/index.ts` | Barrel export: added `buildStockMovements`, `enrichStockMovementsWithDates`, `StockMovementRow` type |
| `src/features/upload/components/UploadForm.tsx` | Added `stockMovements: [] as StockMovementRow[]` to error result object |
| `src/features/upload/actions/importFilesAction.ts` | Added `stockMovements: []` to no-file error return |

---

## Architecture

```
Order Excel Import Pipeline (Iter 44 additions in bold):

1. Parse Order All Excel → OrderItemProcessed[] (with waktuPesananDibuat)
2. Build headers → Map<noPesanan, OrderHeaderProcessed> (with waktuPesananDibuat)
3. **Generate stock movements → buildStockMovements(items) → StockMovementRow[]**
   - qty_valid > 0 → KELUAR record (stock leaving warehouse)
   - qty_return > 0 → MASUK record (stock returning from customer)
4. **Enrich dates → enrichStockMovementsWithDates(movements, orderDates)**
5. **Insert into DB (atomic transaction):**
   - Insert order headers
   - Insert order items
   - Insert income
   - Insert adjustments
   - Insert HPP
   - Insert grosir
   - **Insert stock movements (NEW)**
6. Commit transaction
```

### Stock History Service

```typescript
// From StockHistoryService.ts
buildStockMovements(items): StockMovementRow[]
  for each item:
    if NOT BATAL:
      if qtyValid > 0 → KELUAR record
      if qtyReturn > 0 → MASUK record

enrichStockMovementsWithDates(movements, orderDates): StockMovementRow[]
  for each movement:
    tanggal = extractDateOnly(orderDates.get(movement.noRef))
```

### DbTransaction Extension

```typescript
// From transaction.ts
async insertStockMovements(rows: StockMovementRow[]): Promise<TransactionResult<StockMovementRow[]>>
  payload = rows.map(row => ({
    store_id: "default",
    base_product: row.baseProduct,
    tipe: row.tipe,         // "MASUK" | "KELUAR"
    tanggal: row.tanggal,   // yyyy-mm-dd extracted from order datetime
    no_ref: row.noRef,      // no_pesanan
    qty_base_unit: row.qtyBaseUnit,
    source: "shopee",
    supplier: "",
    keterangan: row.keterangan,
  }))
  → INSERT INTO stock_movements
```

### Stock Movement Table Component

- Filterable by: search text, tipe (MASUK/KELUAR), date range
- Summary cards: total MASUK qty, total KELUAR qty, transaction count
- Color-coded badges: green ▲ MASUK, red ▼ KELUAR
- Columns: Tanggal, Base Product (SKU), Tipe, Qty, No Ref, Keterangan

---

## Business Logic (PRD Compliance)

### PRD 5.8 — stockMovements Table

| Field | Value | Source |
|---|---|---|
| `source` | `"shopee"` | Auto-generated from Shopee import |
| `tipe` | `"KELUAR"` | When qty_valid > 0 (items shipped) |
| `tipe` | `"MASUK"` | When qty_return > 0 (items returned) |
| `tanggal` | `yyyy-mm-dd` | Extracted from `waktuPesananDibuat` of order |
| `no_ref` | `no_pesanan` | Links movement to original order |
| `base_product` | `sku` | SKU of the product moved |

### PRD Section 3.8 — Stock Impact per Item Status

| status_item | qty_valid | qty_return | Stock Impact |
|---|---|---|---|
| NORMAL | > 0 | 0 | 1 × KELUAR (qty_valid) |
| PARTIAL_RETURN | > 0 | > 0 | 1 × KELUAR (qty_valid) + 1 × MASUK (qty_return) |
| FULL_RETURN | 0 | > 0 | 1 × MASUK (qty_return) |
| BATAL | — | — | **No stock movement** |

---

## Verification

- `tsc --noEmit` — **passed** (zero errors)
- TypeScript types: `OrderItemProcessed.waktuPesananDibuat?`, `OrchestratorResult.stockMovements`
- All error paths include `stockMovements` field (parse error, txBegin failure, rollback)
- Stock movements generated only when order buffer exists
- Stock movements inserted atomically within existing transaction
- No circular dependencies introduced
- Follows existing code style: comment density, naming conventions, Indonesian UI text
