"use client"

import { useState, useRef } from "react";
import type { ReactNode } from "react";

/**
 * @module features/upload/components/UploadHistoryTable
 * Upload History Table — searchable, paginated table of import history.
 *
 *
 * Architecture:
 *   UploadHistoryTable → getImportHistoryAction → Supabase
 */


import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getImportHistoryAction } from "@/features/upload/actions/getImportHistoryAction";
import type { ImportHistoryResult, ImportHistoryEntry } from "@/features/upload/actions/getImportHistoryAction";

/* ─── Column Config ─── */

interface ColumnDef<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

const COLUMNS: ColumnDef<ImportHistoryEntry>[] = [
  { key: "noPesanan", label: "No. Pesanan", width: "w-40" },
  { key: "statusOrderFinal", label: "Status Order", width: "w-36" },
  { key: "statusHpp", label: "Status HPP", width: "w-32" },
  { key: "statusIncome", label: "Status Income", width: "w-32" },
  { key: "totalQtyOrder", label: "Qty", width: "w-16 text-right" },
  { key: "totalOmzetValid", label: "Omzet Valid", width: "w-28 text-right" },
  { key: "itemCount", label: "Items", width: "w-16 text-center" },
  { key: "importDate", label: "Import Date", width: "w-40" },
];

/* ─── Format Helpers ─── */

function formatRupiah(value: number): string {
  if (value === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/* ─── Status Badge ─── */

function StatusBadge({ value }: { value: string }) {
  let color = "bg-muted text-muted-foreground";
  if (value.includes("Normal") || value.includes("Lengkap") || value.includes("Cocok") || value.includes("Dihitung")) {
    color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  } else if (value.includes("Retur") || value.includes("Sebagian") || value.includes("Belum")) {
    color = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  } else if (value.includes("Batal") || value.includes("Kosong") || value.includes("Tidak")) {
    color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", color)}>
      {value}
    </span>
  );
}

/* ─── cn helper ─── */

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── UploadHistoryTable Component ─── */

export default function UploadHistoryTable({
  initialData,
  initialSearch,
}: {
  initialData: ImportHistoryResult;
  initialSearch: string;
}) {
  const [data, setData] = useState<ImportHistoryEntry[]>(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = async (value: string) => {
    setSearch(value);
    setIsLoading(true);
    const result = await getImportHistoryAction({ page: 1, pageSize, search: value });
    setData(result.data);
    setTotal(result.total);
    setPage(1);
    setIsLoading(false);
  };

  const handlePageChange = async (newPage: number) => {
    setIsLoading(true);
    const result = await getImportHistoryAction({ page: newPage, pageSize, search });
    setData(result.data);
    setTotal(result.total);
    setPage(newPage);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Riwayat Import</h1>
          <p className="text-sm text-muted-foreground">
            {total} pesanan ditemukan
          </p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Cari no. pesanan..."
            defaultValue={initialSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchRef.current?.value || "");
              }
            }}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Table */}
      <Table variant="default" size="default" isLoading={isLoading} loadingRowCount={8}>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className={col.width}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.noPesanan}>
              {COLUMNS.map((col) => (
                <TableCell key={col.key} className={col.width}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : col.key === "totalOmzetValid"
                      ? formatRupiah(row.totalOmzetValid)
                      : col.key === "importDate"
                        ? formatDate(row.importDate)
                        : col.key === "statusOrderFinal" ||
                            col.key === "statusHpp" ||
                            col.key === "statusIncome"
                          ? <StatusBadge value={String(row[col.key])} />
                          : col.key === "totalQtyOrder" || col.key === "itemCount"
                            ? (
                                <span className={cn(col.key === "itemCount" && "text-center")}>
                                  {row[col.key]}
                                </span>
                              )
                            : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">Tidak ada riwayat import</p>
          <p className="text-xs mt-1">
            {search ? `Tidak ditemukan untuk "${search}"` : "Belum ada data yang di-import"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => handlePageChange(page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => handlePageChange(page + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
