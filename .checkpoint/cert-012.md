# Iterasi 12 — Design System Components

> **Backfill certificate** — generated during audit (Iter 23 complete). Original cert not found on disk.

## File Created (7)

| File | Lines | State |
|------|-------|-------|
| src/components/ui/button.tsx | 77 | polished |
| src/components/ui/card.tsx | 132 | polished |
| src/components/ui/input.tsx | 106 | polished |
| src/components/ui/badge.tsx | 71 | polished |
| src/components/ui/table.tsx | 192 | polished |
| src/components/ui/skeleton.tsx | 13 | polished |
| src/components/ui/loading-spinner.tsx | 63 | polished |

## File Modified (4)

| File | Lines Changed | State |
|------|---------------|-------|
| src/components/ui/index.ts | +14 exports | polished |
| app/globals.css | +CSS variables, base styles | polished |
| src/lib/utils.ts | cn() helper | polished |
| tailwind.config.ts | theme tokens | polished |

## Build Verification
- `npx tsc --noEmit` — PASSED
- All components follow shadcn/ui patterns with Tailwind CSS v4

## Changes Summary

### Primitives (7 components)
- **Button** — variant-driven (default, destructive, outline, ghost, link), size-driven (sm/default/lg/icon), supports asChild
- **Card** — compound component (Card/CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter)
- **Input** — styled input with className forwarding, supports ref
- **Badge** — variant-driven (default/secondary/destructive/outline/success/warning)
- **Table** — compound component (Table/TableHeader/TableBody/TableFooter/TableRow/TableHead/TableCell/TableCaption)
- **Skeleton** — animated placeholder with pulse animation
- **Spinner** — loading spinner with size variants (sm/default/lg)

### Barrel Export
- `src/components/ui/index.ts` — exports all 7 components + variants

### Infrastructure
- `app/globals.css` — CSS variables for TokoBox color tokens (primary, destructive, success, warning, etc.)
- `src/lib/utils.ts` — `cn()` utility using clsx + tailwind-merge
- `tailwind.config.ts` — extended theme with TokoBox design tokens

## Next Action
Iter 13 — Data Components: create OrderMapper, OrderItemMapper, OrderCalculator, OrderSummaryService.

## Issues
- None
