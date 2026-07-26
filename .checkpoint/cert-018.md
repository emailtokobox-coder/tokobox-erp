# Iterasi 18 — Repository Layer

## File Created (5)

| File | Lines | State |
|------|-------|-------|
| src/features/orders/repositories/OrderSupabaseRepository.ts | 329 | built |
| src/features/orders/repositories/index.ts | 7 | built |
| src/features/upload/repositories/UploadRepository.ts | 39 | built |
| src/features/upload/repositories/UploadSupabaseRepository.ts | 229 | built |
| src/features/upload/repositories/index.ts | 7 | built |

## Build Verification
- `npx tsc --noEmit` — **PASSED** for all new files (0 TypeScript errors in src/features/orders/repositories/ & src/features/upload/repositories/)
- Pre-existing test errors in OrderCalculator.test.ts, OrderSummaryService.test.ts — out of scope

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### OrderSupabaseRepository (329 lines)
- Implements `OrderRepository` interface with Supabase PostgREST
- **Pagination helper:** `paginatedQuery<T>()` — handles filter, search (ilike), date range, page/pageSize
- **Items CRUD:** `findItems`, `findItemById`, `findItemsByOrder`, `insertItem`, `insertItems`
- **Headers CRUD:** `findHeaders`, `findHeaderById`, `findHeaderByNoPesanan`, `insertHeader`, `insertHeaders`, `updateHeader`, `deleteHeader`
- **Bulk:** `clearAll()` — deletes from both tables
- **Mappers:** Uses existing `OrderItemMapper` + `OrderMapper` for raw→domain conversion
- **Filter support:** noPesanan, statusOrderFinal, storeId, search (ilike on no_pesanan/nama_produk/sku), dateFrom/dateTo

### UploadRepository (39 lines)
- Interface defining 6 bulk insert methods + 3 exists checks
- Methods: `bulkInsertOrderHeaders`, `bulkInsertOrderItems`, `bulkInsertIncome`, `bulkInsertAdjustments`, `bulkInsertHpp`, `bulkInsertGrosir`
- Idempotency checks: `findIncomeByNoPesanan`, `findHppBySku`, `findGrosirBySku`

### UploadSupabaseRepository (229 lines)
- Implements `UploadRepository` with Supabase PostgREST
- **Bulk inserts:** All 6 table operations with snake_case column mapping
- **Mapper integration:** Order results mapped through `OrderMapper`/`OrderItemMapper`
- **Exists checks:** Single-record queries for idempotency (income by noPesanan, HPP by sku, grosir by sku)

### Barrel Exports
- `orders/repositories/index.ts` — exports `OrderRepository` (stub) + `OrderSupabaseRepository`
- `upload/repositories/index.ts` — exports `UploadRepository` (interface) + `UploadSupabaseRepository`

## Next Action
Iter 19 — Import Orchestrator: create `features/upload/services/ImportOrchestrator.ts` that wires services + repositories together with DbTransaction for atomic multi-table imports.

## Issues
- None
