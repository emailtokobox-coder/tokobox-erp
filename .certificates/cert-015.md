# Iterasi 15 — XLSX Parser + Validation

## File Created (4)

| File | Lines | State |
|------|-------|-------|
| src/lib/xlsx/types.ts | 126 | built |
| src/lib/xlsx/parser.ts | 602 | built |
| src/lib/xlsx/validator.ts | 166 | built |
| src/lib/xlsx/index.ts | 36 | built |

## File Modified (2)

| File | Lines Changed | State |
|------|---------------|-------|
| src/components/ui/confirm-dialog.tsx | -2 (removed unused imports) | built |
| src/components/ui/toast.tsx | +1 (fixed variant type) | built |

## Dependency Installed
- `xlsx@0.18.5` (SheetJS) — added to package.json

## Build Verification
- `npm run build` — **PASSED** (TypeScript 3.8s)
- Fixed 5 TypeScript errors during build verification:
  1. `confirm-dialog.tsx` — unused `React` import (JSX transform)
  2. `confirm-dialog.tsx` — unused `cn` import
  3. `parser.ts` — 3 unused `rowNum` variables (removed)
  4. `validator.ts` — `keyof T` symbol conversion warning (String cast)
  5. `validator.ts` — generic type incompatibility (changed to `unknown[]` + `string[]`)

## Test Results
- Not run (Phase 4 is infrastructure only)

## Changes Summary

### types.ts (126 lines)
- `FileType` enum: ORDER_ALL, INCOME, ADJUSTMENT, HPP, GROSIR, UNKNOWN
- Domain types: `OrderAllRow` (15 fields + 5 optional), `IncomeRow` (17 fields), `AdjustmentRow` (7 fields), `HppRow` (3 fields), `GrosirRow` (7 fields)
- `ParseResult<T>` generic — data + errors + warnings + metadata
- `ParseError`, `ParseWarning` — row, field, message, optional value
- `ColumnMap` — for fixed-offset fallback

### parser.ts (602 lines)
- `readExcelFile(buffer)` → Workbook
- `getSheetNames(workbook)` → string[]
- `detectFileType(sheetNames, fileName)` → FileType
- `parseOrderAll` — header row detection, Tier 1 exact match + Tier 2 fixed offsets per PRD 3.3
- `parseIncome` — header at row 6, data from row 7 per PRD 3.4
- `parseAdjustment` — header at row 18, data from row 19 per PRD 3.5
- `parseHpp` — 2-3 column simple mapping per PRD 3.6
- `parseGrosir` — 7 column mapping per PRD 3.7
- `normalizeHeader`, `buildColumnMap`, `resolveColumn` helpers
- `parseNum` — strips non-numeric chars, returns 0 on NaN

### validator.ts (166 lines)
- `validateFileType` — sheet names + filename pattern check
- `validateRequiredColumns` — header presence validation
- `validateRowCount` — min/max sanity check
- `validateNoEmptyRequiredFields` — null/undefined/empty string check
- `validateParseResult` — full pipeline (type + columns + rows + fields)

### index.ts (36 lines)
- Barrel export: all parsers, validators, types

## Component Count — Phase 4 Progress

| Phase | Files | Status |
|-------|-------|--------|
| Phase 3: Design System | 15 components | ✅ Complete |
| Phase 4: Import Pipeline | 4 lib/xlsx files | ✅ Iter 15 complete |
| Phase 4: Upload Services | 0 files | ⏳ Next (Iter 16) |

## Next Action
Iter 16 — Upload Services: Create `features/upload/services/` with ImportOrderService, ImportIncomeService, ImportAdjustmentService, ImportHppService, ImportGrosirService.

## Issues
- None
