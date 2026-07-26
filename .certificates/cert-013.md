# Iterasi 13 — Data Components

## File Modified (3)

| File | Lines | Before → After | State |
|------|-------|---------------|-------|
| src/components/ui/table.tsx | 178 → 192 | +14 | built |
| src/components/ui/dialog.tsx | 113 → 121 | +8 | built |
| src/components/ui/badge.tsx | 46 → 71 | +25 | built |

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| src/components/ui/tabs.tsx | 122 | built |
| src/components/ui/index.ts | 18 | built |

## Build Verification
- `npm run build` — **PASSED**
- `tsc --noEmit` — 0 errors in UI component files

## Test Results
- Not run (Phase 3 is design system only)

## Changes Summary

### Table — +14 lines
- Added `ArrowUpDown` icon import from lucide-react
- `TableHead` now accepts `sortable`, `sortDirection`, `onSort` props
- Sortable headers show ArrowUpDown icon, cursor-pointer, hover:text-foreground
- data-sortable and data-sort-direction attributes for styling hooks

### Dialog — +8 lines
- `DialogContent` now accepts `size` prop: sm, default, lg, full
- Size maps to max-width: sm (max-w-sm), default (max-w-lg), lg (max-w-2xl), full (95vw, 90vh)
- data-size attribute for styling hooks

### Badge — +25 lines
- Added `dot` variant prop (boolean) — renders a 6px colored circle before text
- Added `dotColorMap` — maps badge variant to dot color (foreground colors)
- CVA updated: gap-1.5 for dot spacing, `dot: true/false` variant
- Padding adjusted: `pl-1.5` when dot is present

### New: Tabs (122 lines)
- Context-based architecture (TabsContext) — no prop drilling
- `Tabs` — wrapper with controlled/uncontrolled value support
- `TabsList` — tab bar container with role="tablist"
- `TabsTrigger` — individual tab button with role="tab", aria-selected
- `TabsContent` — tab panel with role="tabpanel", conditional rendering
- Active state styling: bg-background + shadow-sm
- Inactive state: hover:text-foreground transition

### Barrel Export
- `index.ts` updated with Tabs exports (now 13 component exports total)

## Next Action
Iter 14 — Feedback Components: Enhance Toast with positions/auto-dismiss/actions, create ConfirmDialog, create Drawer component.

## Issues
- None
