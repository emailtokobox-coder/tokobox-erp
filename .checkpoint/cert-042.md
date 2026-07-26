# Iterasi 42 — Order Management: order deletion + improved detail page

## File Created (1)
| File | Lines | State |
|------|-------|-------|
| src/features/orders/components/dialogs/DeleteOrderDialog.tsx | 48 | built |

## File Modified (4)
| File | Lines Changed | State |
|------|---------------|-------|
| src/features/orders/actions/index.ts | +30 | built |
| src/features/orders/components/OrderListTable.tsx | +35 | built |
| src/features/orders/components/OrderDetailTable.tsx | +30 | built |
| src/features/orders/actions/index.test.ts | +2 | built |

## Changes Summary

### 1. deleteOrderAction connected to Supabase
- Changed from stub (return false) to real implementation
- Fetches order header by noPesanan to get id
- Deletes order_items first (FK constraint), then orders header
- Returns boolean success/failure

### 2. DeleteOrderDialog component created
- Uses existing ConfirmDialog with destructive variant
- Trash2 icon, loading state during deletion
- Confirmation message with order number
- onDeleted callback for optimistic UI updates

### 3. OrderListTable wired with delete
- Added actions column with Trash2 icon button per row
- Opens DeleteOrderDialog on click
- Optimistic UI: removes row from local state after successful delete
- Decrements total count

### 4. OrderDetailTable improved
- Added Hapus button in header (red destructive style)
- Wired to deleteOrderAction → redirects to /orders on success
- ConfirmDialog for confirmation before deletion

### 5. Barrel exports updated
- components/index.ts exports DeleteOrderDialog
- Updated test for new deleteOrderAction signature (string param)

## Test Results
- Build verified: tsc --noEmit passed (0 errors)

## Next Action
Iter 43: Upload/Import pipeline implementation.

## Issues
- None
