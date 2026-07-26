# Iterasi 23 — Phase 4 Finalize + Phase 5 Kickoff

## File Created (4)

| File | Tests | Lines | State |
|------|-------|-------|-------|
| src/features/upload/tests/ImportOrderService.test.ts | 20 | ~170 | tested |
| src/features/upload/tests/ImportIncomeService.test.ts | 5 | ~110 | tested |
| src/features/upload/tests/ImportHppService.test.ts | 6 | ~85 | tested |
| src/features/upload/tests/ImportGrosirService.test.ts | 8 | ~120 | tested |

## File Modified (1)

| File | Change | State |
|------|--------|-------|
| src/features/upload/services/ImportOrderService.ts | Export processItem + processHeader | built |

## Build Verification
- `npx tsc --noEmit` — **PASSED** (0 TypeScript errors in upload feature)
- `npx vitest run src/features/upload/tests/` — **40/40 PASSED**

## Test Results

### ImportOrderService.test.ts (20 tests)
- **processItem()**: NORMAL, PARTIAL_RETURN, FULL_RETURN, BATAL status, qtyReturn cap, hppPerSku lookup, hargaPerQty, itemHash determinism
- **processHeader()**: aggregation, statusOrderFinal variants, statusHpp variants (Lengkap/Sebagian/Kosong/Batal), default statusIncome/statusProfit, omzetRetur/hppRetur aggregation

### ImportIncomeService.test.ts (5 tests)
- Parse income rows from XLSX buffer (with 5 metadata rows + header + data, matching Shopee format)
- Idempotency: same values → skip + warning
- Different values → keep + warning
- New rows → pass through
- Empty data rows → 0 valid rows

### ImportHppService.test.ts (6 tests)
- hppMap from single/multiple SKUs
- SKU normalization (lowercase trimmed)
- Duplicate SKU overwrite
- Empty file → empty map

### ImportGrosirService.test.ts (8 tests)
- Single tier per SKU
- Multiple tiers per SKU
- Multiple SKUs grouped separately
- SKU normalization
- Empty file → empty map
- Optional fields (berlakuSampai, catatan)
- Duplicate SKU entries appended

## Architecture Note
- Exported `processItem()` and `processHeader()` from `ImportOrderService` for testability (functions were previously private)
- Income/Grosir/Hpp tests use XLSX buffer creation to test the full parse → service pipeline (not just pure functions)

## Next Action
Iter 24 — Phase 5 Kickoff: Order List Page — create `app/orders/page.tsx` with searchable/paginated order table.

## Issues
- None
