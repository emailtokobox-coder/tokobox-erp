# Iterasi 17 — Transaction Handler

## File Created (3)

| File | Lines | State |
|------|-------|-------|
| src/lib/supabase/client.ts | 25 | built |
| src/lib/database/transaction.ts | 532 | built |
| src/lib/database/index.ts | 7 | built |

## File Modified (1)

| File | Lines Changed | State |
|------|---------------|-------|
| package.json | +1 dep | polished |

## Build Verification
- `npx tsc --noEmit` — **PASSED** for all new files (0 TypeScript errors in src/lib/database/ & src/lib/supabase/)
- Pre-existing test errors in `src/features/orders/` — out of scope (Iter 12-16 range)

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### Supabase Client Factory (src/lib/supabase/client.ts, 25 lines)
- `createSupabaseClient()` — factory function that reads `APP_CONFIG.supabaseUrl` + `supabaseAnonKey`
- Throws descriptive error if env vars are missing
- Returns `SupabaseClient` instance ready for use

### DbTransaction (src/lib/database/transaction.ts, 532 lines)
- `TransactionResult<T>` interface — generic result type with `success`, `data?`, `error?`
- PostgREST transaction header helpers: `txHeaders()`, `txCommitHeaders()`, `txRollbackHeaders()`
- `applyTxHeaders()` helper — casts `as any` to bypass TypeScript's protected `.headers()` on `PostgrestBuilder`
- **Transaction lifecycle:** `begin()` → operations → `commit()` / `rollback()`
- **Insert operations (6 tables):**
  - `insertOrders()` → `orders` table
  - `insertOrderItems()` → `order_items` table
  - `insertIncome()` → `income` table
  - `insertAdjustments()` → `adjustments` table
  - `insertHpp()` → `hpp` table
  - `insertGrosir()` → `grosir` table
- **Auto-rollback:** every insert method catches errors and calls `autoRollback()` automatically
- **Generic executor:** `executeInTransaction<T>(fn)` for custom operations within transaction scope
- **Error wrapping:** all `PostgrestError` → `DatabaseError` (from `lib/errors.ts`)
- **Guard:** all insert methods check `this.active` — reject if transaction not started

### Barrel Export (src/lib/database/index.ts, 7 lines)
- Re-exports `DbTransaction`, `TransactionResult`, `createSupabaseClient`

### Dependency (package.json)
- Added `@supabase/supabase-js: ^2.110.8` to dependencies

## Next Action
Iter 18 — Repository Layer: create repositories per feature module (orders, income, adjustment, hpp, grosir) using DbTransaction. Wire repositories to upload services for DB writes.

## Issues
- None
