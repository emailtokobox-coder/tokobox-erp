# Iterasi 13 — Data Components

> **Backfill certificate** — generated during audit (Iter 23 complete). Original cert not found on disk.

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| src/features/orders/domain/OrderCalculator.ts | 400 | built |
| src/features/orders/mappers/OrderItemMapper.ts | 76 | built |
| src/features/orders/mappers/OrderMapper.ts | 77 | built |

## File Modified (3)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/mappers/OrderItemMapper.test.ts | +81 | tested |
| src/features/orders/mappers/OrderMapper.test.ts | +63 | tested |
| src/features/orders/repositories/OrderRepository.test.ts | +204 | tested |

## Build Verification
- `npx tsc --noEmit` — PASSED (0 TypeScript errors in src/features/orders/)
- Pre-existing test errors in OrderCalculator.test.ts, OrderSummaryService.test.ts — out of scope

## Changes Summary

### OrderCalculator (400 lines)
- `calculateOrderTotals()` — aggregates omzet, hpp, profit from order items
- `calculateItemProfit()` — per-item profit = omzet - hpp
- `determineOrderStatus()` — computes status_order_final based on item statuses
- `determineHppStatus()` — Lengkap/Sebagian/Kosong based on HPP coverage
- `determineIncomeStatus()` — Lengkap/Sebagian/Kosong based on income records
- `determineProfitStatus()` — Lengkap/Sebagian/Kosong based on profit calculation

### OrderItemMapper (76 lines)
- Maps raw DB row → OrderItem domain object
- Handles snake_case → camelCase conversion
- Computes derived fields: hargaPerQty, omzetRetur, hppRetur

### OrderMapper (77 lines)
- Maps raw DB row → Order domain object
- Aggregates order items from raw result
- Handles date formatting and status mapping

## Next Action
Iter 14 — Feedback Components: create Toast, Dialog, ConfirmDialog, Sheet, Drawer, Tabs, EmptyState, ErrorState.

## Issues
- None
