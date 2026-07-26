# Iterasi 15 — XLSX Parser + Validation

> **Backfill certificate** — generated during audit (Iter 23 complete). Original cert not found on disk.

## File Created (4)

| File | Lines | State |
|------|-------|-------|
| src/lib/xlsx/types.ts | 126 | polished |
| src/lib/xlsx/parser.ts | 602 | polished |
| src/lib/xlsx/validator.ts | 166 | polished |
| src/lib/xlsx/index.ts | 36 | polished |

## Build Verification
- `npx tsc --noEmit` — PASSED (0 TypeScript errors in src/lib/xlsx/)
- Added `xlsx` package to dependencies for Excel file parsing

## Changes Summary

### types.ts (126 lines)
- `RawRow` — generic raw row type (Record<string, unknown>)
- `FileType` — enum: ORDER_ALL, INCOME, ADJUSTMENT, HPP, GROSIR
- `FileTypeInfo` — metadata per file type (label, description, expectedSheets, skipRows, requiredColumns)
- `FILE_TYPE_INFO` — lookup table for all 5 file types
- `ParseResult<T>` — generic result with success flag, data, errors, warnings, rowCount, sheetName
- `ValidationResult` — valid/invalid rows with error messages per row
- `ImportRow` — normalized row type after parsing

### parser.ts (602 lines)
- `readFile(buffer)` — reads ArrayBuffer → detects file type from content
- `parseXLSX(buffer, fileType)` — main parsing function using xlsx library
- `detectFileType(buffer)` — auto-detects file type from sheet names + column headers
- **Per-type parsers:**
  - `parseOrderSheet()` — Shopee order format (5 metadata rows, header row, data rows)
  - `parseIncomeSheet()` — income format with no_pesanan + nominal
  - `parseAdjustmentSheet()` — adjustment format with no_pesanan + nominal + alasan
  - `parseHppSheet()` — HPP format with sku_produk + nama_produk + nilai_hpp
  - `parseGrosirSheet()` — grosir format with sku + nama_produk + tier quantities + harga
- **Normalization:** All parsers normalize keys to lowercase snake_case
- **Row validation:** Each parser checks required columns and reports missing ones
- **Encoding:** Handles UTF-8 + fallback for Indonesian characters

### validator.ts (166 lines)
- `validateOrderRows()` — validates order data: no_pesanan required, qty must be positive, harga_per_qty required
- `validateIncomeRows()` — validates income data: no_pesanan required, nominal required
- `validateAdjustmentRows()` — validates adjustment data: no_pesanan required, nominal required
- `validateHppRows()` — validates HPP data: sku required, hpp value required
- `validateGrosirRows()` — validates grosir data: sku required, tier quantities required
- `validateAll()` — orchestrates validation for all file types
- Returns ValidationResult with per-row error details

### barrel Export (index.ts)
- Re-exports types, parse functions, detectFileType, and validation functions

## Next Action
Iter 16 — Upload Services: create ImportOrderService, ImportIncomeService, ImportAdjustmentService, ImportHppService, ImportGrosirService.

## Issues
- None
