# Iterasi 36 — Status Tracker + Settings Pages Implementation

## File Created (9)

| File | Lines | State |
|------|-------|-------|
| src/features/status-tracker/constants/kanbanColumns.ts | 80 | built |
| src/features/status-tracker/types/index.ts | 20 | built |
| src/features/status-tracker/actions/index.ts | 80 | built |
| src/features/status-tracker/components/StatusKanban.tsx | 130 | built |
| src/features/status-tracker/index.ts | 10 | built |
| app/status-tracker/page.tsx | 120 | built |
| src/features/settings/types/index.ts | 40 | built |
| src/features/settings/actions/index.ts | 200 | built |
| app/settings/page.tsx | 400 | built |

## File Modified (1)

| File | Lines Changed | State |
|------|---------------|-------|
| src/features/settings/index.ts | +3 | built |

## Test Results
- TypeScript build: `tsc --noEmit` passed (0 errors)
- No unit tests for UI components in this iteration

## What Was Built

### Status Tracker Feature
- **kanbanColumns**: 7 kanban columns (Draft, Menunggu, Produksi, Siap Kirim, Terkirim, Lunas, Selesai) with color-coded badges
- **Status Mapping**: Manual order statuses → kanban columns (CASH/DP/TERMIN flows), Shopee order statuses → kanban columns
- **getUnifiedOrdersAction**: Merges Shopee orders + manual orders into unified list, sorted by date desc
- **StatusKanban**: Horizontal kanban board with order cards showing no. order, customer, total, source badge (Manual/Shopee), linked to detail pages
- **Status Tracker Page**: Filter bar (date range, status, search), column summary badges, kanban board

### Settings Feature
- **Types**: StoreProfile, AppSettings, UserAccount, UserRole, BackupRecord, BackupType
- **Actions**: 10 server actions for profile, app settings, user CRUD, backup management
- **Settings Page**: Tabbed interface with 4 tabs:
  - **Profil Toko**: Store profile form (nama toko, alamat, no telepon, marketplace rate %, currency)
  - **Backup**: 4 backup types (database, invoice_pdf, foto_resi, arsip_data) with trigger + history
  - **User Management**: CRUD users with role assignment (admin/staff/viewer), add form, role selector, delete confirmation
  - **App Settings**: Default min hari stok, theme (light/dark/system), language (id/en)

## Build Verification
- `tsc --noEmit`: 0 errors, 0 warnings

## Next Action
Iter 37: Dashboard page implementation (KPI cards, charts, insights)

## Issues
- None
