# Iterasi 16 — Upload Services

## File Created (7)

| File | Lines | State |
|------|-------|-------|
| src/features/upload/types.ts | 102 | built |
| src/features/upload/services/ImportOrderService.ts | 264 | built |
| src/features/upload/services/ImportIncomeService.ts | 97 | built |
| src/features/upload/services/ImportAdjustmentService.ts | 74 | built |
| src/features/upload/services/ImportHppService.ts | 78 | built |
| src/features/upload/services/ImportGrosirService.ts | 77 | built |
| src/features/upload/services/index.ts | 10 | built |

## Build Verification
- `npm run build` — **PASSED** (TypeScript 3.9s)
- Fixed 5 TypeScript errors during verification:
  1. `types.ts` — unused `import type` (re-export only)
  2. `ImportAdjustmentService.ts` — unused `AdjustmentRow` import
  3. `ImportAdjustmentService.ts` — unused `adjustmentByOrder` variable
  4. `ImportHppService.ts` — unused `detectFileType` + `fileType`
  5. `ImportGrosirService.ts` — unused `detectFileType` + `fileType`

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### types.ts (102 lines)
- `ImportStatus` — pending/parsing/validating/processing/done/error
- `FileTypeInfo` + `FILE_TYPE_INFO` — label + description per file type
- `ImportResult<T>` — generic result with success, status, data, errors, warnings, summary
- `OrderItemProcessed` — business logic output (PRD 3.8: qty_valid, harga_per_qty, omzet, hpp, status_item, item_hash)
- `OrderHeaderProcessed` — aggregated order output (PRD 3.9: totals, status_order_final, status_hpp, status_income, status_profit)

### ImportOrderService (264 lines)
- `processItem()` — PRD 3.8 logic: qty_return guard, harga_per_qty, omzet_valid/retur, hpp_valid/retur, status_item, item_hash
- `processHeader()` — PRD 3.9 logic: aggregate totals, status_order_final, status_hpp
- `import(buffer, hppMap)` — orchestrates read → detect → parse → process → group
- `buildHeaders(items)` — builds OrderHeaderProcessed map from items

### ImportIncomeService (97 lines)
- `import(buffer, existingIncome)` — parse + idempotency check
- Rules: same values → skip, different values → would update

### ImportAdjustmentService (74 lines)
- `import(buffer)` — parse + basic structure ready for aggregation

### ImportHppService (78 lines)
- `import(buffer)` — parse + build SKU → HPP map (normalized lowercase)

### ImportGrosirService (77 lines)
- `import(buffer)` — parse + build SKU → GrosirRow[] map (multiple tiers per SKU)

### Barrel Export (10 lines)
- Re-exports all 5 services from `services/index.ts`

## Next Action
Iter 17 — Transaction Handler: create `lib/database/transaction.ts` with Supabase transaction wrapper for atomic imports.

## Issues
- None
