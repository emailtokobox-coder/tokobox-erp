# Iterasi 26 — Order Detail Enhancements

## File Created (0)
No new files created.

## File Modified (3)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/components/OrderListTable.tsx | +2 lines (added Link import + noPesanan clickable render) | built |
| src/features/orders/actions/index.ts | +55 lines (extended getOrderDetailAction: income + adjustments queries, new return type) | built |
| src/features/orders/components/OrderDetailTable.tsx | +65 lines (added income + adjustments props, Income detail card, Adjustment detail table) | built |

## Test Results
- Build verification: tsc --noEmit passed (no errors)

## Features Implemented
- **Clickable noPesanan**: OrderListTable noPesanan column now renders as Next.js Link to `/orders/{noPesanan}`
- **Income detail section**: OrderDetailTable shows payment method, release date, gross price, discounts, fees, commission, total income (Rupiah formatted)
- **Adjustment detail section**: OrderDetailTable shows adjustment table with date, type, and adjustment cost (Rupiah formatted)
- **Extended getOrderDetailAction**: Now fetches income records (incomes table) + adjustment records (adjustments table) by no_pesanan

## Next Action
Iter 27: Order detail further enhancements per PRD 7.2 (profit breakdown detail, export CSV, sort items table columns).

## Issues
- [ ] No profit breakdown detail section yet (only raw profit values shown)
- [ ] No CSV export functionality yet
- [ ] Items table columns not sortable yet
