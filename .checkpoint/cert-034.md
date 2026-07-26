# Iterasi 34 — Manual Orders form pages wiring + no_manual_order generation + payment schedule UI

## File Created (0)
No new files created — existing files modified.

## File Modified (6)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/manual-orders/actions/index.ts | +56 → 149 | built |
| app/manual-orders/new/page.tsx | +8 → 39 | built |
| app/manual-orders/[id]/edit/page.tsx | +12 → 50 | built |
| src/features/manual-orders/components/forms/ManualOrderForm.tsx | +110 → 542 | built |
| src/features/manual-orders/types/ManualOrder.ts | +2 → 108 | built |
| src/features/manual-orders/types/ManualOrderFilter.ts | +1 → 13 | built |

## Architecture

```
Page (server) → getNextManualOrderNumber() → ManualOrderForm (client) → createManualOrderAction → Repositories → Supabase
```

- **Create page** (`new/page.tsx`): Fetches next order number server-side, passes to form, redirects to detail on success
- **Edit page** (`[id]/edit/page.tsx`): Fetches existing order, pre-fills form, redirects to detail on update
- **Form** (`ManualOrderForm.tsx`): Added conditional DP schedule (persentase + nominal with auto-calc) and Termin schedule (add/remove rows with total summary)
- **Actions** (`actions/index.ts`): Added `getNextManualOrderNumber()` (MO-YYYYMMDD-###), `createManualOrderAction` auto-generates number + tanggal, inserts DP/Termin payment schedules

## Test Results

- Build verified: `tsc --noEmit` passed (0 errors)

## Next Action

Iter 35: Manual Orders detail page enhancements — payment tracking, status flow progression, print invoice/label actions.

## Issues

- None
