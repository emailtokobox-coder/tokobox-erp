# Iterasi 31 — Manual Orders Detail/Create/Edit Pages

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| src/features/manual-orders/components/dialogs/ManualOrderDetail.tsx | 516 | built |
| app/manual-orders/[id]/page.tsx | 51 | built |

## File Modified (2)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/manual-orders/components/index.ts | +1 | built |
| src/features/manual-orders/types/ManualOrder.ts | +5 fields | built |

## Test Results
- No tests for this iteration (UI-only, tested via build)
- Build: `tsc --noEmit` passed

## Features Implemented

### ManualOrderDetail (dialogs/ManualOrderDetail.tsx)
- **4 tabs** per PRD 7.9 spec:
  - **Detail tab**: Order info card (no. order, tipe badge, status badge, tanggal, pelanggan, alamat, no. HP, ekspedisi, metode bayar, diskon, pajak, ongkir, total qty, total berat) + financial summary card (subtotal, diskon, pajak, ongkir, total harga, total bayar, sisa bayar) + items table (nama produk, qty, berat, harga satuan, subtotal)
  - **Pembayaran tab**: DP payments table (urutan, tanggal, persentase, nominal, metode, status badge) + Termin payments table (urutan, jatuh tempo, persentase, nominal, metode, status badge)
  - **Resi tab**: Resi data display (no. resi, ekspedisi, tanggal kirim, bukti foto link, terkirim WA status) + add resi form stub (disabled, ready for Supabase)
  - **WhatsApp tab**: Send WA form (type selector: INVOICE/RESI/PELUNASAN/FOLLOW_UP/DP_REQUEST + send button with loading state) + WA logs history table (tipe, nomor, status badge, waktu)
- Back button navigation via `useRouter`
- Not-found state with error message
- Format helpers: `formatRupiah`, `formatDate`
- Status badge helper (completed=green, pending=amber, active=outline)
- Tipe badge helper (Cash=green, DP=blue, Termin=purple)

### Server Page (app/manual-orders/[id]/page.tsx)
- Server component with Suspense loading skeleton
- Calls `getManualOrderDetailAction(id)` 
- Renders `ManualOrderDetail` with all props
- Error handling via try/catch

### Type Extension (ManualOrder.ts)
- Added fields per PRD DB schema 5.15: `totalHarga`, `totalBayar`, `sisaPembayaran`, `dpPersentase`, `dpNominal`, `terminSchedule`

## Next Action
Iter 32: Manual Orders create form page — create new manual order form with items, payment, discount, tax, shipping per PRD 7.9.

## Issues
- None
