# Certificate 045 — Iter 45: Stock Saldo Auto-Sync

**Date:** 2026-07-25
**Status:** ✅ Complete
**Build Verified:** `tsc --noEmit` passed (zero errors)

---

## Scope

Build a complete auto-sync pipeline that aggregates stock saldo from `stockMovements` records and writes/updates them into the `stockSaldo` table. Runs both automatically after import (in ImportOrchestrator) and manually via a "Sync Saldo" button on the inventory page.

---

## Files Created (1)

| File | Purpose |
|------|---------|
| `src/features/inventory/services/StockSaldoService.ts` | Service class with `computeSaldoFromMovements()`, `syncStockSaldo()`, `getMovementSummary()` static methods + `toMovementRow()` helper |

## Files Modified (7)

| File | Change |
|------|--------|
| `src/features/inventory/actions/index.ts` | Added `syncStockSaldoAction()` + `getLastSyncDateAction()` server actions; imports `toMovementRow` |
| `src/features/inventory/components/StockSaldoTable.tsx` | Summary bar (total produk/saldo, last sync date), Sync button, status badges per row |
| `src/features/inventory/services/index.ts` | Barrel exports for `StockSaldoService`, `SaldoSyncResult`, `MovementSummary`; re-exports `StockMovementRow` from types |
| `src/features/inventory/types/index.ts` | Added `StockMovementRow` interface (consolidated from StockHistoryService) |
| `app/(dashboard)/inventori/page.tsx` | Fetches `lastSyncAt` via `getLastSyncDateAction`, passes to StockSaldoTable |
| `src/features/upload/services/ImportOrchestrator.ts` | Auto-sync call after stock movements insert within same transaction; `saldoSyncResult` in all return paths |
| `src/features/inventory/services/StockHistoryService.ts` | Removed local `StockMovementRow` interface, now imports from types |
| `src/features/upload/actions/importFilesAction.ts` | Added `saldoSyncResult: null` to empty OrchestratorResult |
| `src/features/upload/components/UploadForm.tsx` | Added `saldoSyncResult: null` to error path OrchestratorResult |

---

## Implementation Details

### 1. StockSaldoService (`StockSaldoService.ts`)

**`computeSaldoFromMovements(movements)`** — Loops all stock movements, aggregates by `base_product`:
- MASUK → saldo += qty_base_unit
- KELUAR → saldo -= qty_base_unit
- OPNAME/SALDO_AWAL → skipped (not part of daily import flow)

**`syncStockSaldo(client, saldoMap)`** — Idempotent upsert into `stockSaldo` table:
- Check existing record → if saldo unchanged, skip
- If different → update
- If new → insert with store_id "default"

**`getMovementSummary(baseProduct, movements)`** — Per-product aggregation: total_masuk, total_keluar, saldo_akhir, last_movement_date

**`toMovementRow(movement)`** — Converts `StockMovement[]` → `StockMovementRow[]`, filtering out non-daily types (OPNAME, SALDO_AWAL)

### 2. Server Actions (`actions/index.ts`)

**`syncStockSaldoAction()`** — Manual trigger:
1. Fetch all stockMovements from DB
2. Convert to StockMovementRow[] via `toMovementRow()`
3. Compute saldo map
4. Detect negative saldo warnings
5. Upsert via `StockSaldoService.syncStockSaldo()`
6. Return { syncedCount, skippedCount, errors, warnings }

**`getLastSyncDateAction()`** — Returns most recent `last_updated` from stockSaldo table

### 3. ImportOrchestrator Integration

After `insertStockMovements()` succeeds within the transaction:
```typescript
if (stockMovements.length > 0) {
  const saldoMap = StockSaldoService.computeSaldoFromMovements(stockMovements)
  saldoSyncResult = await StockSaldoService.syncStockSaldo(this.client, saldoMap)
}
```

Atomic: saldo sync happens in the same DB transaction as stock movements insert.

### 4. StockSaldoTable Enhancements

- **Summary bar**: Total produk count, total saldo sum, last sync timestamp
- **Sync button**: "Sinkronisasi Saldo" calls `syncStockSaldoAction()` with loading state
- **Status badges**: Normal (green, saldo > 0), Rendah (amber, saldo ≤ 0), Kosong (red, saldo = 0)
- **New column**: Status badge in table body

### 5. Type Consolidation

`StockMovementRow` was duplicated between `StockHistoryService.ts` and needed in multiple places. Consolidated into `inventory/types/index.ts` and re-exported via barrel. This eliminates type mismatch errors when passing movements between orchestrator and service layers.

---

## Architecture

```
Auto-trigger (after import):
  ImportOrchestrator.run()
    → insertStockMovements() [DB transaction]
    → StockSaldoService.computeSaldoFromMovements() [in-memory]
    → StockSaldoService.syncStockSaldo(client, saldoMap) [same transaction]
    → commit()

Manual trigger (UI):
  User clicks "Sync Saldo" button
    → syncStockSaldoAction()
      → fetch stockMovements from DB
      → toMovementRow() filter
      → computeSaldoFromMovements()
      → syncStockSaldo()
      → return { syncedCount, skippedCount, errors, warnings }
```

---

## Verification

- `tsc --noEmit` — ✅ Zero errors
- TypeScript strict mode — ✅ No violations
- React 19 + Next.js 16 patterns — ✅ Named imports, no `import * as React`
- `"use client"` directive — ✅ First line in StockSaldoTable.tsx
- Server actions — ✅ No functions passed server→client, direct action calls
