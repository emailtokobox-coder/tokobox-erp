# Iterasi 35 — Manual Orders Detail Page Enhancements

## File Created (2)

| File | Lines | State |
|------|-------|-------|
| src/features/manual-orders/components/dialogs/StatusFlow.tsx | 120 | built |
| src/features/manual-orders/components/dialogs/PaymentTracking.tsx | 250 | built |

## File Modified (7)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/manual-orders/constants/manualOrderStatus.ts | +60 | built |
| src/features/manual-orders/actions/index.ts | +55 | built |
| src/features/manual-orders/components/dialogs/ManualOrderDetail.tsx | +85 | built |
| src/features/manual-orders/components/index.ts | +3 | built |
| src/features/manual-orders/index.ts | +5 | built |
| app/manual-orders/[id]/page.tsx | +4 | built |
| app/globals.css | +20 | built |

## Test Results
- TypeScript build: `tsc --noEmit` passed (0 errors)
- No unit tests for UI components in this iteration

## What Was Built

### Status Flow System
- `getStatusFlow(tipe)` — returns the status pipeline for CASH/DP/TERMIN
- `getNextStatuses(current, tipe)` — returns valid next status
- `canTransition(from, to, tipe)` — validates a status transition
- `getStatusLabel(status)` — human-readable status labels

### StatusFlow Component
- Visual stepper showing all statuses in the pipeline
- Current status highlighted, past statuses marked with checkmark
- "Advance to next status" button with loading state
- Completion indicator when order reaches final status

### PaymentTracking Component
- DP payments table with confirmation workflow (Lunas/Ditolak)
- Termin payments table with summary (total persentase + nominal)
- Confirmation dialogs with bukti pembayaran URL input
- Per-row action buttons (checkmark for Lunas, X for Ditolak)

### Print Actions
- Print Invoice (A4 PDF) — customer info + items table + financial summary
- Print Label (A6) — shipping label with customer + total
- Print Surat Jalan (A4) — delivery note with items + signature lines
- Dark mode aware (reads document color scheme)

### Resi Form
- Functional form to add resi data (no resi, ekspedisi, tanggal kirim)
- Integrated with `addResiDataAction` server action
- Existing resi displayed with bukti foto link

### WhatsApp Logs
- `getManualOrderDetailAction` now fetches WhatsApp logs
- WA logs table in WhatsApp tab (tipe, nomor, status, waktu)

## Build Verification
- `tsc --noEmit`: 0 errors, 0 warnings

## Next Action
Iter 36: Status Tracker + Settings pages implementation

## Issues
- None
