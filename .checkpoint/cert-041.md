# Iterasi 41 — Order Management UI enhancements

## File Created (1)
| File | Lines | State |
|------|-------|-------|
| src/features/orders/components/index.ts | 5 | built |

## File Modified (5)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/actions/index.ts | +6 | built |
| src/features/orders/components/OrderListTable.tsx | +285 | built |
| src/features/orders/components/OrderDetailTable.tsx | +35 | built |
| app/orders/page.tsx | +14 | built |
| src/features/orders/index.ts | +1 | built |

## Changes Summary

### 1. OrderFilter type enhanced
- Added `statusHpp`, `statusIncome`, `dateFrom`, `dateTo` fields to filter DTO

### 2. getOrdersAction enhanced
- Added query filters for `status_hpp`, `status_income` columns
- Date range support via `waktu_pesanan_dibuat` gte/lte

### 3. OrderListTable rewritten with PRD 7.2 compliance:
- Sortable columns: Tanggal, Omzet Valid, Profit (click headers)
- Profit column added (Rp profitSetelahPenyesuaian)
- CSV Export button for filtered list
- HPP status filter dropdown (HPP Lengkap, Sebagian, Kosong, Tidak Perlu HPP / Batal)
- Income status filter dropdown (Sudah Cocok, Belum Ada Income, Tidak Perlu Income)
- Date range filter (Dari Tanggal — Sampai Tanggal)
- Active filter count indicator ("3 filter aktif")
- Reset button to clear all filters
- Pagination improved: 50 items per page (was 20)
- Active filter count in subtitle

### 4. OrderDetailTable enhanced:
- Profit column added to items table (omzetValid - hppValid per item)
- Profit is sortable alongside existing columns
- Green/red color coding for profit values

### 5. Barrel exports updated
- Created src/features/orders/components/index.ts
- Updated src/features/orders/index.ts to export components

## Test Results
- Build verified: tsc --noEmit passed (0 errors)

## Next Action
Iter 42: Order Management — order deletion + improved detail page.

## Issues
- None
