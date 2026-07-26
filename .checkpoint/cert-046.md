# Iter 46: Manual Orders Service Layer + Edge Cases

**Timestamp:** 2026-07-26T18:30:00Z
**Status:** Complete
**Phase:** Phase 5: Supplier + PO Pages

## Deliverables

### A. ManualOrderService (`src/features/manual-orders/services/ManualOrderService.ts`)

Business logic service layer separating calculations from Supabase queries:

1. **`calculateOrderTotal(items, diskon, pajak, ongkir)`** — Computes subtotal (SUM qty × hargaSatuan), applies diskon percentage, adds pajak + ongkir, clamps total to never negative. Returns `OrderCalculation` breakdown object.

2. **`validateOrder(data)`** — Validates: namaPelanggan non-empty (min 2 chars), noHp min 8 digits, items non-empty with qty > 0 and harga > 0, termin persentase totals 100%, totalBayar ≤ totalHarga. Returns `ValidationResult` with errors array.

3. **`buildOrderNumber(storeId, tanggal, existingNumbers)`** — Generates MO-YYYYMMDD-NNN format with 3-digit sequence per day. Checks existing numbers to avoid duplicates. Returns unique order number.

4. **`recalculateSisaPembayaran(terminSchedule, dpBaru?, totalHarga)`** — Computes remaining payment from schedule + DP, clamped at 0.

### B. Zod Validation Schema (`src/features/manual-orders/schemas/ManualOrderSchema.ts`)

- `manualOrderSchema` — Full order validation: nama (min 2), noHp (pattern), items (min 1, each valid), diskon (0-100%), pajak/ongkir (>= 0)
- `partialManualOrderSchema` — For updates (all fields optional)
- `manualOrderItemSchema` — Item validation: namaProduk required, qty positive int, harga positive int
- `terminScheduleEntrySchema` — Persentase 0-100, nominal >= 0
- `parseWithErrors()` helper — Returns typed ValidationError[] from Zod errors

### C. ManualOrdersTable Enhancements (`src/features/manual-orders/components/table/ManualOrdersTable.tsx`)

1. **Error Boundary** — `actionError` state + `ErrorState` component with `variant="card"` showing error title/description + `RefreshCw` retry button
2. **Optimistic Updates** — `window.__manualOrdersRefresh` global callback for create/edit pages to trigger list refresh without full page reload

### D. Barrel Exports Updated

- `src/features/manual-orders/services/index.ts` — exports `manualOrderService` + types
- `src/features/manual-orders/schemas/index.ts` — exports all schemas + `parseWithErrors`
- `src/features/manual-orders/index.ts` — added services + schemas exports

## Files Created

| File | Lines | Description |
|------|-------|-------------|
| `src/features/manual-orders/services/ManualOrderService.ts` | 208 | Service with 4 methods |
| `src/features/manual-orders/services/index.ts` | 10 | Barrel export |
| `src/features/manual-orders/schemas/ManualOrderSchema.ts` | 130 | Zod schemas |
| `src/features/manal-orders/schemas/index.ts` | 9 | Schema barrel export |
| `src/features/manual-orders/services/ManualOrderService.test.ts` | 235 | 26 unit tests |

## Files Modified

| File | Change |
|------|--------|
| `src/features/manual-orders/components/table/ManualOrdersTable.tsx` | Error state + optimistic refresh |
| `src/features/manual-orders/index.ts` | Added services/schemas exports |
| `.checkpoint/state.json` | Updated for Iter 46 |

## Verification

- `tsc --noEmit` — **passed** (0 errors)
- `vitest run ManualOrderService.test.ts` — **26 passed** (0 failed)
- Existing tests: no regressions (pre-existing orders/actions test failures are env-var related, unchanged)

## Next Action

Iter 47: Stock Opname page + reconciliation.
