# Iterasi 27 — Order Detail Enhancements

## File Created (0)
No new files created.

## File Modified (1)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/components/OrderDetailTable.tsx | +55 lines (sortable columns, profit breakdown card) | built |

## Test Results
- Build verification: tsc --noEmit passed (no errors)

## Features Implemented
- **Sortable items table**: All 12 column headers are now clickable — sort asc/desc with ChevronUp/ChevronDown indicators. Sorting uses React.useMemo for performance.
- **Profit Breakdown card**: Visual breakdown showing Omzet Valid → HPP Valid (red, negative) → Profit Kotor → Income (green) → Penyesuaian → Profit Setelah Penyesuaian (bold, conditional green/red color) → Margin Profit percentage.

## Next Action
Iter 28: Order detail final polish per PRD 7.2 (CSV export for items, responsive table, error boundary).

## Issues
- [ ] No CSV export functionality yet
- [ ] No responsive table (horizontal scroll on mobile)
- [ ] No error boundary for detail page
