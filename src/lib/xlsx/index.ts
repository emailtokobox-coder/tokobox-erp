/**
 * @module lib/xlsx
 * XLSX parsing — SheetJS wrapper + validation for Shopee Excel files.
 */

export {
  readExcelFile,
  getSheetNames,
  detectFileType,
  parseOrderAll,
  parseIncome,
  parseAdjustment,
  parseHpp,
  parseGrosir,
} from "./parser";

export {
  validateFileType,
  validateRequiredColumns,
  validateRowCount,
  validateNoEmptyRequiredFields,
  validateParseResult,
} from "./validator";

export type {
  FileType,
  OrderAllRow,
  IncomeRow,
  AdjustmentRow,
  HppRow,
  GrosirRow,
  ParseResult,
  ParseError,
  ParseWarning,
  ColumnMap,
} from "./types";
