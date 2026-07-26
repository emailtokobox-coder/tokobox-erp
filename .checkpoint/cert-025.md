# Iterasi 25 — Order Detail Page

## File Created (2)
| File | Lines | State |
|------|-------|-------|
| src/features/orders/components/OrderDetailTable.tsx | 175 | built |
| app/orders/[noPesanan]/page.tsx | 41 | built |

## File Modified (1)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/actions/index.ts | +80 lines (extended getOrderDetailAction to fetch order_items + map via RawOrderItem, added RawOrderItem import) | built |

## Test Results
- Build verification: tsc --noEmit passed (no errors)

## Features Implemented
- **OrderDetailTable component**: back button, order info card with status badges (final/HPP/income/profit), financial summary with Rupiah formatting, items table with qty/omzet/HPP columns, status item badges, conditional not-found state
- **Dynamic route page**: `app/orders/[noPesanan]/page.tsx` with Suspense loading skeleton
- **Extended action**: `getOrderDetailAction` now fetches both `orders` header and `order_items` by `no_pesanan`

## Next Action
Iter 26: Order Detail Page enhancements — add clickable noPesanan links in OrderListTable rows, link OrderDetailTable back to list, add Income/Adjustment detail sections per PRD 7.2 spec.

## Issues
- [ ] OrderListTable rows not yet linked to detail page (noPesanan click)
- [ ] No Income/Adjustment detail sections yet (only shown as badge in header)
- [ ] 3 new file hashes are placeholder (sha256:000...) — compute actual hashes after first build
