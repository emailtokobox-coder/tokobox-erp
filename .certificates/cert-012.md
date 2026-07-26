# Iterasi 12 — Design System Components

## File Modified (4)

| File | Lines | Before → After | State |
|------|-------|---------------|-------|
| src/components/ui/button.tsx | 53 → 77 | +24 | built |
| src/components/ui/card.tsx | 86 → 132 | +46 | built |
| src/components/ui/input.tsx | 21 → 106 | +85 | built |
| src/components/ui/table.tsx | 111 → 178 | +67 | built |

## File Created (3)

| File | Lines | State |
|------|-------|-------|
| src/components/ui/loading-spinner.tsx | 63 | built |
| src/components/ui/error-state.tsx | 65 | built |
| src/components/ui/index.ts | 17 | built |

## Recovery Infrastructure Created (5 files)

| File | Purpose |
|------|---------|
| .scoreboard/current.json | Global state tracking |
| .scoreboard/progress.json | File-level state machine + SHA-256 hashes |
| .scoreboard/session.md | Session log with last action + next action |
| .scoreboard/pivot.json | Active file tracking |
| resume-next.txt | Resume gate for next iteration |

## Build Verification
- `npm run build` — **PASSED** (Finished TypeScript in 3.6s)
- `tsc --noEmit` — 0 errors in UI component files
- Pre-existing test errors (OrderCalculator.test.ts, OrderSummaryService.test.ts) — out of scope

## Test Results
- Not run (Phase 3 is design system only, no new tests in this iteration)

## Changes Summary

### Button — +24 lines
- Added variants: `elevated` (shadow-md), `flat` (no shadow)
- Added props: `loading` (spinner + disabled), `error` (destructive border), `fullWidth`
- Added aria-busy and aria-invalid for accessibility

### Card — +46 lines
- Added `elevation` prop (none/sm/md/lg → shadow mapping)
- Added `padding` prop (none/compact/default/spacious)
- Added `isLoading` state (skeleton overlay)
- Added `error` state (destructive border)
- CardTitle now uses `text-lg` for proper heading hierarchy

### Input — +85 lines
- Added `label` prop (built-in label with htmlFor)
- Added `error` prop (error message + aria-invalid + border-destructive)
- Added `helperText` prop (caption text below input)
- Added `inputSize` prop (sm/default/lg via spacing scale)
- Added `isLoading` state (spinner in right slot)
- Added `leftIcon` / `rightIcon` props (icon slots)
- aria-describedby for error/helper text accessibility

### Table — +67 lines
- Added `variant` prop (default/striped/bordered)
- Added `size` prop (sm/default/lg for row height)
- Added `isLoading` + `loadingRowCount` props (skeleton rows)
- Added `emptyState` prop (renders when no data)
- data-slot attributes for all sub-components

### New: Spinner
- Size variants: sm (16px), default (24px), lg (32px)
- Color variants: primary, muted, success, warning, error
- SVG-based with aria-label="Loading" + sr-only text

### New: ErrorState
- Variant modes: inline, card, full-page
- AlertTriangle icon, title, description
- Default retry action (Button with RefreshCw)
- Data-slot attributes for all sections

## Next Action
Iter 13 — Data Components: Enhance Table with sort/filter/pagination slots, add Tabs component, enhance Dialog with size variants, enhance Badge with dot indicator and status color mapping.

## Issues
- None
