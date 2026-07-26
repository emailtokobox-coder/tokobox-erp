# Iterasi 19 — Import Orchestrator

## File Created (1)

| File | Lines | State |
|------|-------|-------|
| src/features/upload/services/ImportOrchestrator.ts | 279 | built |

## File Modified (1)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/upload/services/index.ts | +3 | built |

## Build Verification
- `npx tsc --noEmit` — **PASSED** (0 TypeScript errors in src/features/upload/)
- Pre-existing test errors in OrderCalculator.test.ts, OrderSummaryService.test.ts — out of scope

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### ImportOrchestrator (279 lines)
- `ImportPayload` interface — defines optional buffers for all 5 file types + existingIncome map
- `OrchestratorResult` interface — comprehensive result with all parse results + transaction status
- **Step 1 — Parse all files:** Sequential parsing with dependency order (HPP first → Order needs hppMap → Income needs existingIncome)
- **Step 2 — Build order headers:** `ImportOrderService.buildHeaders()` aggregates items into headers
- **Step 3 — DB write within transaction:** Single `DbTransaction` wrapping all 6 table inserts
  - If any parse errors → skip DB write entirely
  - If any DB error → auto-rollback, return partial results
  - On success → commit, return all results with `transactionCommitted: true`
- **Error handling:** Collects parse errors prefixing with `[Order]`, `[Income]`, etc.
- **Idempotency:** Passes `existingIncome` map through to `ImportIncomeService`

### Barrel Export (index.ts)
- Added `ImportOrchestrator` + type exports `ImportPayload`, `OrchestratorResult`

## Next Action
Iter 20 — Upload Actions: create `features/upload/actions/` with Server Actions that wire ImportOrchestrator to the UI. Actions: `importFilesAction`, `getImportHistoryAction`.

## Issues
- None
