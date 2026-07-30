"use client"

import { useRef, useState, useCallback } from "react";

/**
 * @module features/upload/components/UploadForm
 * Upload form component — two-step flow: select files → preview → confirm import.
 *
 * Flow (per PRD 7.3 + 9.7):
 *   STEP 1: User selects files
 *   STEP 2: "Lihat Preview" → getPreviewAction → PreviewTable (no DB write)
 *   STEP 3: User clicks "Import" → importFilesAction → ImportOrchestrator → DB
 *
 * Architecture:
 *   UploadForm → getPreviewAction / importFilesAction → ImportOrchestrator → Services → Repositories → DbTransaction → Supabase
 */


import { Upload, FileSpreadsheet, Loader2, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPreviewAction } from "@/features/upload/actions/getPreviewAction";
import { importFilesAction } from "@/features/upload/actions/importFilesAction";
import type { OrchestratorResult } from "../services/ImportOrchestrator";
import type { IncomeRow, AdjustmentRow, HppRow, GrosirRow } from "@/lib/xlsx";
import type { OrderItemProcessed } from "../types";
import type { StockMovementRow } from "@/features/inventory/services";
import PreviewTable from "./PreviewTable";
import type { FilePreview } from "../actions/getPreviewAction";

/* ─── File Type Config ─── */

interface FileTypeConfig {
  key: string;
  label: string;
  description: string;
  accept: string;
}

const FILE_TYPES: FileTypeConfig[] = [
  { key: "orderFile", label: "Order All", description: "Daftar semua pesanan dari Shopee", accept: ".xlsx,.xls" },
  { key: "incomeFile", label: "Income", description: "Data income / dana dilepaskan", accept: ".xlsx,.xls" },
  { key: "adjustmentFile", label: "Adjustment", description: "Data penyesuaian biaya", accept: ".xlsx,.xls" },
  { key: "hppFile", label: "HPP", description: "Harga pokok penjualan per SKU", accept: ".xlsx,.xls" },
  { key: "grosirFile", label: "Harga Grosir", description: "Harga grosir per SKU", accept: ".xlsx,.xls" },
];

/* ─── Step Types ─── */

type Step = "select" | "preview" | "importing" | "result";

/* ─── Upload State ─── */

interface UploadState {
  step: Step;
  preview: {
    order?: FilePreview;
    income?: FilePreview;
    adjustment?: FilePreview;
    hpp?: FilePreview;
    grosir?: FilePreview;
  };
  result: Awaited<ReturnType<typeof importFilesAction>> | null;
  isPreviewing: boolean;
  isImporting: boolean;
}

function initialState(): UploadState {
  return {
    step: "select",
    preview: {},
    result: null,
    isPreviewing: false,
    isImporting: false,
  };
}

/* ─── File Input Component ─── */

function FileInput({
  config,
  onFileChange,
  selectedFile,
}: {
  config: FileTypeConfig;
  onFileChange: (key: string, file: File | null) => void;
  selectedFile: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onFileChange(config.key, file);
        }}
        className="hidden"
        id={`file-${config.key}`}
      />
      <label
        htmlFor={`file-${config.key}`}
        className="flex items-center gap-3 flex-1 cursor-pointer rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50 transition-colors px-4 py-3"
      >
        <FileSpreadsheet className="size-5 text-muted-foreground shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">
            {selectedFile ? selectedFile.name : config.label}
          </span>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
        {selectedFile && (
          <span className="size-2 rounded-full bg-green-500 shrink-0" title="File dipilih" />
        )}
      </label>
    </div>
  );
}

/* ─── Result Display ─── */

function ResultDisplay({ result }: { result: Awaited<ReturnType<typeof importFilesAction>> }) {
  if (!result) return null;

  const allResults = [
    { label: "Order", data: result.orders },
    { label: "Income", data: result.income },
    { label: "Adjustment", data: result.adjustments },
    { label: "HPP", data: result.hpp },
    { label: "Grosir", data: result.grosir },
  ];

  const hasAnyData = allResults.some((r) => r.data.data.length > 0);

  return (
    <div className="mt-6 space-y-4">
      {/* Transaction Status */}
      <div
        className={`
          flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium
          ${result.success && result.transactionCommitted
            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
            : "bg-destructive/10 text-destructive border border-destructive/20"
          }
        `}
      >
        {result.success && result.transactionCommitted
          ? `Import berhasil ${allResults.reduce((sum, r) => sum + r.data.data.length, 0)} baris ditambahkan`
          : `Import gagal ${result.errors.length} kesalahan`}
      </div>

      {/* Summary Cards */}
      {hasAnyData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {allResults
            .filter((item) => item.data.data.length > 0)
            .map((item) => (
              <Card key={item.label} className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-2xl font-semibold">{item.data.data.length}</p>
                <p className="text-xs text-muted-foreground">
                  {item.data.summary.validRows} valid / {item.data.summary.totalRows} total
                </p>
              </Card>
            ))}
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.errors.map((err: string, i: number) => (
                <li key={i} className="text-sm text-destructive/80">{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {allResults.some((r) => r.data.warnings.length > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-yellow-700 dark:text-yellow-400">Peringatan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {allResults.flatMap((r) =>
                r.data.warnings.map((w: string, i: number) => (
                  <li key={`${r.label}-${i}`} className="text-sm text-yellow-600 dark:text-yellow-400/80">
                    [{r.label}] {w}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── UploadForm Component ─── */

export default function UploadForm() {
  const [state, setState] = useState<UploadState>(initialState());
  const [files, setFiles] = useState<{
    orderFile: File | null;
    incomeFile: File | null;
    adjustmentFile: File | null;
    hppFile: File | null;
    grosirFile: File | null;
  }>({
    orderFile: null,
    incomeFile: null,
    adjustmentFile: null,
    hppFile: null,
    grosirFile: null,
  });

  const hasFiles = Object.values(files).some((f) => f !== null);

  /* --- Handlers --- */

  const handleFileChange = useCallback((key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setState((prev) => ({ ...prev, step: "select", preview: {} }));
  }, []);

  const handlePreview = useCallback(async () => {
    setState((prev) => ({ ...prev, isPreviewing: true }));

    try {
      const formData = new FormData();
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          formData.append(key, file);
        }
      }

      const result = await getPreviewAction(formData);
      const preview: UploadState["preview"] = {};
      if (result.files.order) { preview.order = result.files.order; }
      if (result.files.income) { preview.income = result.files.income; }
      if (result.files.adjustment) { preview.adjustment = result.files.adjustment; }
      if (result.files.hpp) { preview.hpp = result.files.hpp; }
      if (result.files.grosir) { preview.grosir = result.files.grosir; }

      setState({
        step: "preview",
        preview,
        result: null,
        isPreviewing: false,
        isImporting: false,
      });
    } catch {
      setState({
        step: "select",
        preview: {},
        result: null,
        isPreviewing: false,
        isImporting: false,
      });
    }
  }, [files]);

  const handleImport = useCallback(async () => {
    setState((prev) => ({ ...prev, isImporting: true }));

    const formData = new FormData();
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        formData.append(key, file);
      }
    }

    try {
      const result = await importFilesAction(formData);
      setState({
        step: "result",
        preview: state.preview,
        result,
        isImporting: false,
        isPreviewing: false,
      });
    } catch (err) {
      const errorOrcResult: OrchestratorResult = {
        success: false,
        orders: { success: false, status: "error", data: [] as OrderItemProcessed[], errors: [], warnings: [], summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 } },
        income: { success: false, status: "error", data: [] as IncomeRow[], toUpdate: [], errors: [], warnings: [], summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 } },
        adjustments: { success: false, status: "error", data: [] as AdjustmentRow[], errors: [], warnings: [], summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 } },
        hpp: { success: false, status: "error", data: [] as HppRow[], errors: [], warnings: [], summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 }, hppMap: new Map() },
      grosir: { success: false, status: "error", data: [] as GrosirRow[], errors: [], warnings: [], summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 }, grosirMap: new Map() },
      saldoSyncResult: null,
      incomeImported: false,
      adjustmentsImported: false,
      hppImported: false,
      stockMovements: [] as StockMovementRow[],
      transactionCommitted: false,
      errors: [err instanceof Error ? err.message : "Terjadi kesalahan tak terduga"],
    };

      setState({
        step: "result",
        preview: state.preview,
        result: errorOrcResult,
        isImporting: false,
        isPreviewing: false,
      });
    }
  }, [files, state.preview]);

  const handleReset = useCallback(() => {
    setState({
      step: "select",
      preview: {},
      result: null,
      isPreviewing: false,
      isImporting: false,
    });
    setFiles({
      orderFile: null,
      incomeFile: null,
      adjustmentFile: null,
      hppFile: null,
      grosirFile: null,
    });
  }, []);

  /* --- Render --- */

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-5" />
          Import Data
        </CardTitle>
        <CardDescription>
          Upload file Excel untuk import data pesanan, income, adjustment, HPP, dan harga grosir.
          Semua data diinsert dalam satu transaksi atomic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: File Selection */}
        {state.step === "select" && (
          <>
            {FILE_TYPES.map((config) => (
              <FileInput
                key={config.key}
                config={config}
                onFileChange={handleFileChange}
                selectedFile={files[config.key as keyof typeof files]}
              />
            ))}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handlePreview}
                disabled={!hasFiles || state.isPreviewing}
                loading={state.isPreviewing}
              >
                {state.isPreviewing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Membaca file...
                  </>
                ) : (
                  <>
                    Lihat Preview
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Preview */}
        {state.step === "preview" && !state.result && (
          <>
            <p className="text-sm text-muted-foreground">
              Pratinjau data sebelum import. Periksa apakah data sudah benar sebelum melanjutkan.
            </p>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {state.preview.order && (
                <PreviewTable title="Order All" preview={state.preview.order} />
              )}
              {state.preview.income && (
                <PreviewTable title="Income" preview={state.preview.income} />
              )}
              {state.preview.adjustment && (
                <PreviewTable title="Adjustment" preview={state.preview.adjustment} />
              )}
              {state.preview.hpp && (
                <PreviewTable title="HPP" preview={state.preview.hpp} />
              )}
              {state.preview.grosir && (
                <PreviewTable title="Harga Grosir" preview={state.preview.grosir} />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setState((prev) => ({ ...prev, step: "select" }))}
              >
                <ChevronLeft className="size-4" />
                Kembali
              </Button>
              <Button
                onClick={handleImport}
                disabled={state.isImporting}
                loading={state.isImporting}
              >
                {state.isImporting ? (
                  <>
                    <RotateCcw className="size-4 animate-spin" />
                    Mengimport...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Import Sekarang
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Result */}
        {state.step === "result" && state.result && (
          <>
            <ResultDisplay result={state.result} />
            <div className="flex justify-start pt-4">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="size-4" />
                Import Lagi
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
