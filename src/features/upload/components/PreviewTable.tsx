"use client"

/**
 * @module features/upload/components/PreviewTable
 * Preview table component — displays parsed Excel preview data per file type.
 *
 * Shows column headers, first 5 sample rows, row counts, and error/warning summaries.
 * Per PRD 7.3: preview before import shows headers, 5 sample rows, row count, errors/warnings.
 *
 * Usage in components:
 *   <PreviewTable title="Order All" preview={filePreview} />
 */


import { FileSpreadsheet, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FilePreview } from "../actions/getPreviewAction";

/* ─── Preview Table Props ─── */

interface PreviewTableProps {
  /** Display title for this file preview section */
  title: string;
  /** The preview data for a single file */
  preview: FilePreview;
  /** Whether to show the full preview (default true) */
  showFull?: boolean;
}

/* ─── Type Badge ─── */

function TypeBadge({ matched }: { matched: boolean }) {
  const color = matched ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400";
  const label = matched ? "Sesuai" : "Tidak Sesuai";
  return <Badge className={`${color} text-xs font-medium`}>{label}</Badge>;
}

/* ─── Summary Row ─── */

function SummaryRow({ preview }: { preview: FilePreview }) {
  const summaryItems = [
    { label: "Total Baris", value: preview.totalRows, icon: FileSpreadsheet },
    { label: "Berhasil", value: preview.parsedRows, icon: CheckCircle2 },
    { label: "Error", value: preview.errorRows, icon: XCircle },
    { label: "Peringatan", value: preview.warnings.length, icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {summaryItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <item.icon className="size-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Error/Warnings List ─── */

function ErrorWarningList({ preview }: { preview: FilePreview }) {
  if (preview.errors.length === 0 && preview.warnings.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {preview.errors.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs font-semibold text-destructive mb-1">Error ({preview.errors.length})</p>
          <ul className="space-y-0.5">
            {preview.errors.slice(0, 10).map((err, i) => (
              <li key={i} className="text-xs text-destructive/80 flex items-start gap-1">
                <span className="shrink-0 mt-0.5">•</span>
                <span className="truncate">{err}</span>
              </li>
            ))}
          </ul>
          {preview.errors.length > 10 && (
            <p className="text-xs text-muted-foreground mt-1">...dan {preview.errors.length - 10} error lainnya</p>
          )}
        </div>
      )}
      {preview.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-3">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Peringatan ({preview.warnings.length})</p>
          <ul className="space-y-0.5">
            {preview.warnings.slice(0, 10).map((warn, i) => (
              <li key={i} className="text-xs text-yellow-600 dark:text-yellow-500/80 flex items-start gap-1">
                <span className="shrink-0 mt-0.5">•</span>
                <span className="truncate">{warn}</span>
              </li>
            ))}
          </ul>
          {preview.warnings.length > 10 && (
            <p className="text-xs text-muted-foreground mt-1">...dan {preview.warnings.length - 10} peringatan lainnya</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── PreviewTable Component ─── */

export default function PreviewTable({ title, preview, showFull = true }: PreviewTableProps) {
  const { headers, sampleRows } = preview;

  if (!showFull) return null;
  if (preview.errors.some((e) => e.toLowerCase().includes("gagal membaca file"))) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <XCircle className="size-4 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{preview.errors[0]}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="size-4" />
            {title}
          </CardTitle>
          <TypeBadge matched={preview.typeMatch} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <SummaryRow preview={preview} />

        {/* Type Message */}
        {preview.typeMessage && (
          <p className="text-xs text-muted-foreground mb-2">{preview.typeMessage}</p>
        )}

        {/* Data Table */}
        {headers.length > 0 && sampleRows.length > 0 && (
          <div className="border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, i) => (
                    <TableHead key={i} className="text-xs font-semibold whitespace-nowrap sticky top-0 bg-background">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleRows.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {headers.map((header, colIdx) => (
                      <TableCell key={colIdx} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                        {String(row[header] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {headers.length === 0 && sampleRows.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Tidak ada data untuk ditampilkan</p>
        )}

        {/* Errors & Warnings */}
        <ErrorWarningList preview={preview} />
      </CardContent>
    </Card>
  );
}
