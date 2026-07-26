# Iter 47: Finance Module — Income Sync & Profit Recalculation

**Timestamp:** 2026-07-26T18:30:00Z  
**Status:** Complete  
**Phase:** Phase 5: Supplier + PO Pages  

## Deliverables

### A. IncomeSummaryService (`src/features/finance/services/IncomeSummaryService.ts`)

Pure business logic for income matching and estimation (per PRD Section 3.10):

1. **`matchIncomeToOrders(headers, incomes, marketplaceRatePct)`** — Matches `income.noPesanan → order.noPesanan`. Idempotent: skips orders already marked "Sudah Cocok" with unchanged values. Calculates estimated income for unmatched non-cancelled orders using marketplace fee deduction.

2. **`calculateEstimatedIncome(order, marketplaceRatePct)`** — Computes estimasi = `totalOmzetValid - (totalOmzetValid × ratePct/100)`. Returns 0 for cancelled or zero-omzet orders. Clamps to minimum 0.

### B. ProfitRecalculationService (`src/features/finance/services/ProfitRecalculationService.ts`)

Pure profit recalculation logic (per PRD Section 3.11–3.13):

1. **`recalculateProfit(order, totalPenyesuaian)`** — Computes profit before and after adjustment per formula:
   - `profitSebelumPenyesuaian = incomeAktual - totalHppValid`
   - `profitSetelahPenyesuaian = incomeAktual + totalPenyesuaian - totalHppValid`
   - `profitMargin = totalOmzetValid > 0 ? (profitSetelahPenyesuaian / totalOmzetValid) × 100 : 0`

   Returns idempotency flag; skips cancelled orders ("Tidak Dihitung") and orders without income ("Belum Ada Income").

2. **`recalculateAll(headers, adjustments)`** — Aggregates adjustments by order, applies `recalculateProfit` to each non-batal order, returns summary counts (recalculated, skipped, batal).

3. **`buildUpdatePayload(headers, adjustments)`** — Creates a `Map<noPesanan, Partial<OrderHeader>>` containing only orders that need DB updates, respecting idempotency.

### C. Server Actions (`src/features/finance/actions/`)

- **`incomeSyncAction(storeId)`** — Orchestrator trigger after income import. Fetches orders and income records, uses `IncomeSummaryService.matchIncomeToOrders()` to match/estimate, then updates order headers in DB via Supabase. Returns `IncomeSyncResult` with matched/estimated counts and error list.

- **`profitRecalculateAction(storeId)`** — Trigger after HPP or adjustment insert. Fetches orders and adjustments, uses `ProfitRecalculationService.buildUpdatePayload()` to compute changes, then updates profit fields in DB. Returns `ProfitRecalculateResult` with counts.

### D. ImportOrchestrator Integration (`src/features/upload/actions/importFilesAction.ts`)

Post-import triggers added: when `transactionCommitted` is true and either `incomeImported`, `adjustmentsImported`, or `hppImported` is true, the action asynchronously calls `incomeSyncAction` or `profitRecalculateAction` using store_id from settings table. Fire-and-forget pattern ensures errors don't block import response.

### E. Tests

- **`IncomeSummaryService.test.ts`** — 18 tests covering matchIncomeToOrders (matching, estimation, idempotency, payment info enrichment), calculateEstimatedIncome (custom rates, edge cases).

- **`ProfitRecalculationService.test.ts`** — 20 tests covering recalculateProfit (basic calculation, adjustment, cancellation, no-income, margin, idempotency), recalculateAll (batal skip, aggregation, idempotency), buildUpdatePayload (payload correctness, edge cases). All passing.

### F. Barrel Exports Updated

- `src/features/finance/index.ts` — Exports services, actions, types, components.
- `src/features/finance/services/index.ts` — Exports `IncomeSummaryService`, `ProfitRecalculationService`, and their result types.

## Files Created

| File | Lines | Description |
|------|-------|-------------|
| `src/features/finance/types/IncomeRecord.ts` | 32 | Income record interface matching Supabase `incomes` table |
| `src/features/finance/types/ProfitReport.ts` | 42 | Profit report interfaces (MonthlyProfit, ProfitBreakdown, etc.) |
| `src/features/finance/types/index.ts` | 8 | Types barrel export |
| `src/features/finance/actions/incomeSyncAction.ts` | 242 | Income sync server action |
| `src/features/finance/actions/profitRecalculateAction.ts` | 205 | Profit recalculate server action |
| `src/features/finance/actions/index.ts` | 143 | Finance actions barrel (replaced stubs with real implementations) |
| `src/features/finance/services/IncomeSummaryService.ts` | 185 | Income matching & estimation service |
| `src/features/finance/services/ProfitRecalculationService.ts` | 251 | Profit recalculation service |
| `src/features/finance/services/index.ts` | 15 | Services barrel export |
| `src/features/finance/tests/IncomeSummaryService.test.ts` | 274 | 18 unit tests for income service |
| `src/features/finance/tests/ProfitRecalculationService.test.ts` | 280 | 20 unit tests for profit service |

## Files Modified

| File | Change |
|------|--------|
| `src/features/upload/actions/importFilesAction.ts` | Added `incomeSyncAction` and `profitRecalculateAction` triggers post-import; added necessary imports |
| `.checkpoint/state.json` | Updated with new iteration entry (Iter 47) |

## Verification

- `tsc --noEmit` — **passed** (0 errors)
- `vitest run` — **38 passed** (0 failed) in finance tests
- Existing tests: no regressions

## Next Action

Iter 48: Stock Opname page + reconciliation (see resume-next.txt).
