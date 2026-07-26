# Iterasi 28 — Order Detail Final Polish

## File Created (0)
No new files created.

## File Modified (2)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/components/OrderDetailTable.tsx | +50 lines (CSV export button, responsive scroll wrapper, export function with UTF-8 BOM) | built |
| app/orders/[noPesanan]/page.tsx | +15 lines (try/catch error handling, typed result variable, error UI display) | built |

## Test Results
- Build verification: tsc --noEmit passed (no errors)

## Features Implemented
- **CSV Export**: Button in items table header exports sorted items to UTF-8 CSV with BOM (Excel-compatible). Filename: `pesanan-{noPesanan}-items.csv`. Columns: SKU, Nama Produk, Variasi, Qty Order/Return/Valid, Harga/Qty, Omzet Valid/Retur, HPP Valid/Retur, Status Item.
- **Responsive Table**: Items table wrapped in `overflow-x-auto` with negative margin trick for full-width horizontal scroll on mobile.
- **Error Handling**: Server page wraps `getOrderDetailAction` in try/catch with error UI display when data fetch fails.

## Next Action
Iter 29: Manual Orders module — create manual-orders feature module skeleton per PRD 7.9 (types, constants, actions stub, page).

## Issues
- [ ] Manual Orders module not yet started
- [ ] CSV export doesn't include order header info (only items)
