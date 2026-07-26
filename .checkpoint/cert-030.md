# Iterasi 30 — Manual Orders List Page UI

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| src/features/manual-orders/components/table/ManualOrdersTable.tsx | 385 | built |
| src/features/manual-orders/components/index.ts | 4 | built |

## File Modified (2)

| File | Lines Changed | State |
|------|---------------|-------|
| app/manual-orders/page.tsx | +10 / -45 | built |
| src/features/manual-orders/index.ts | +1 | built |

## Test Results
- No tests for this iteration (UI-only, tested via build)
- Build: `tsc --noEmit` passed

## Features Implemented
- **ManualOrdersTable** — client component with:
  - Tipe filter dropdown (Cash / DP / Termin)
  - Status filter dropdown (13 manual order statuses with readable labels)
  - Search input (by no. order / pelanggan, Enter key to submit)
  - Status badges (ManualOrderStatusBadge: completed=green, pending=amber)
  - Tipe badges (TipeBadge: Cash=green, DP=blue, Termin=purple)
  - Rupiah currency formatting (formatRupiah)
  - Pagination (prev/next buttons, 20 items per page)
  - Create button (Pesanan Baru → /manual-orders/new)
  - Empty state (contextual: "Belum ada pesanan manual" vs "Tidak ada pesanan yang cocok")
  - Loading state via Table `isLoading` prop
- **Page integration** — server page fetches initial data, passes to client table via Suspense
- **Barrel exports** — components/index.ts + manual-orders/index.ts updated

## Next Action
Iter 31: Manual Orders detail/create/edit pages — detail page with tabs (Detail, Pembayaran, Resi, WhatsApp), create form, edit form per PRD 7.9.

## Issues
- None
