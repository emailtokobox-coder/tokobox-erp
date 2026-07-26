# Iterasi 32 — Manual Orders Create/Edit Form Pages

## File Created (3)

| File | Lines | State |
|------|-------|-------|
| src/features/manual-orders/components/forms/ManualOrderForm.tsx | 482 | built |
| app/manual-orders/new/page.tsx | 39 | built |
| app/manual-orders/[id]/edit/page.tsx | 49 | built |

## File Modified (2)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/manual-orders/components/index.ts | +1 | built |
| src/features/manual-orders/index.ts | +2 components | built |

## Test Results
- No tests for this iteration (UI-only, tested via build)
- Build: `tsc --noEmit` passed

## Features Implemented

### ManualOrderForm (forms/ManualOrderForm.tsx)
- **Customer Info section**: Nama Pelanggan, Alamat, No. HP, Ekspedisi
- **Order Type & Payment section**: Tipe Pesanan (Cash/DP/Termin), Metode Pembayaran (Cash/Transfer/QRIS), Status Order — all via native `<select>` dropdowns
- **Items table**: Nama Produk, Qty, Harga Satuan, Berat (gram), Subtotal — with add/remove item buttons, auto-calculate subtotal per item
- **Financial section**: Diskon (%), Diskon (Rp), Pajak (Rp), Ongkir (Rp) — with auto-calculate total (subtotal - diskon + pajak + ongkir), live summary display
- **Catatan field**: Optional notes text input
- **Submit button**: Loading state with spinner, disabled when no items
- **Props**: `initialData` for edit mode, `onSubmit` callback, `submitLabel` customization
- Reusable for both create and edit pages

### Server Pages
- **app/manual-orders/new/page.tsx**: Renders ManualOrderForm with onSubmit stub (console.log)
- **app/manual-orders/[id]/edit/page.tsx**: Fetches existing order via getManualOrderDetailAction, passes as initialData to ManualOrderForm

### Barrel Exports
- components/index.ts: added ManualOrderForm
- index.ts: added ManualOrderDetail + ManualOrderForm

## Next Action
Iter 33: Manual Orders repositories + Supabase integration for CRUD operations — connect stubs to actual Supabase queries per PRD.

## Issues
- None
