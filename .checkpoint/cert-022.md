# Iterasi 22 — Upload History Page

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| app/upload/history/page.tsx | 47 | built |
| src/features/upload/components/UploadHistoryTable.tsx | 248 | built |

## File Modified (1)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/upload/components/index.ts | +3 | built |

## Build Verification
- `npx tsc --noEmit` — **PASSED** (0 TypeScript errors in app/upload/ & src/features/upload/)
- Pre-existing test errors in OrderCalculator.test.ts, OrderSummaryService.test.ts — out of scope

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### app/upload/history/page.tsx (47 lines)
- Next.js App Router page at `/upload/history`
- Server component — calls `getImportHistoryAction` with search params
- Suspense boundary with `HistorySkeleton` fallback
- Passes `initialData` + `initialSearch` to `UploadHistoryTable`

### UploadHistoryTable (248 lines)
- "use client" — manages search state and re-fetching
- **ColumnDef** — typed column configuration for the table
- **Search input** — with debounce on Enter key, calls `getImportHistoryAction`
- **StatusBadge** — color-coded badges for order status (green/yellow/red)
- **Format helpers** — `formatRupiah()` for currency, `formatDate()` for timestamps
- **Pagination** — Previous/Next buttons with page tracking
- **Empty state** — shows when no results match search
- **Loading state** — Table `isLoading` + `loadingRowCount={8}` for skeletons

### Barrel Export
- Added `UploadHistoryTable` to `components/index.ts`

## Architecture
```
app/upload/history/page.tsx (server)
  → UploadHistoryTable (client)
    → getImportHistoryAction (Server Action)
      → Supabase (orders table)
```

## Columns Displayed
| Column | Width | Format |
|--------|-------|--------|
| No. Pesanan | w-40 | text |
| Status Order | w-36 | color-coded badge |
| Status HPP | w-32 | color-coded badge |
| Status Income | w-32 | color-coded badge |
| Qty | w-16 | right-aligned number |
| Omzet Valid | w-28 | Rupiah format |
| Items | w-16 | centered number |
| Import Date | w-40 | localized datetime |

## Next Action
Iter 23 — Phase 4 Complete: Finalize Phase 4 with integration tests, update all certificates, and prepare Phase 5 (Order Management UI) roadmap.

## Issues
- None
