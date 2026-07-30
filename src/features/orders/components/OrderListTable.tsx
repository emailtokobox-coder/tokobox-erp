"use client"

import { useState, useRef, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

/**
 * @module features/orders/components/OrderListTable
 * Order List Table — searchable, filterable, sortable, paginated table of orders.
 * Supports CSV export of filtered results.
 *
 *
 * Architecture:
 *   OrderListTable → getOrdersAction → Supabase "orders" table
 */


import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, ArrowUpDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import DeleteOrderDialog from "./dialogs/DeleteOrderDialog";
import { getOrdersAction, type OrderListResult } from "../actions";
import type { OrderHeader } from "@/features/orders/types";
import { ORDER_STATUSES } from "../constants/orderStatus";

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

/* ─── CSV Export ─── */

function exportOrdersToCsv(headers: OrderHeader[]): void {
  const cols = [
    "No. Pesanan", "Pembeli", "Status Order", "Status HPP", "Status Income",
    "Qty Valid", "Omzet Valid", "HPP Valid", "Profit", "Items", "Tanggal",
  ];
  const rows = headers.map((h) => [
    h.noPesanan,
    `"${(h.usernamePembeli || "").replace(/"/g, '""')}"`,
    h.statusOrderFinal,
    h.statusHpp,
    h.statusIncome,
    h.totalQtyValid,
    h.totalOmzetValid,
    h.totalHppValid,
    h.profitSetelahPenyesuaian,
    h.itemCount,
    h.waktuPesananDibuat,
  ]);
  const csv = [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pesanan-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─── Status Badge ─── */

function StatusBadge({ value }: { value: string }) {
  let color = "bg-muted text-muted-foreground";
  if (value.includes("Normal") || value.includes("Cocok") || value.includes("Dihitung") || value.includes("Lengkap")) {
    color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  } else if (value.includes("Retur") || value.includes("Sebagian") || value.includes("Belum")) {
    color = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  } else if (value.includes("Batal") || value.includes("Kosong") || value.includes("Tidak")) {
    color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", color)}>
      {value}
    </span>
  );
}

/* ─── Sort Header ─── */

function SortableHead({
  label,
  sortKey,
  currentSort,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 hover:text-primary transition-colors",
        isActive && "text-primary font-medium",
        className,
      )}
    >
      {label}
      {isActive ? (
        sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  );
}

/* ─── cn helper ─── */

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── Status Constants ─── */

const HPP_STATUSES = ["HPP Lengkap", "HPP Sebagian", "HPP Kosong", "Tidak Perlu HPP / Batal"];
const INCOME_STATUSES = ["Sudah Cocok", "Belum Ada Income", "Tidak Perlu Income"];

/* ─── Column Config ─── */

type ColumnKey = keyof Pick<
  OrderHeader,
  | "noPesanan" | "usernamePembeli" | "statusOrderFinal" | "statusHpp"
  | "statusIncome" | "totalQtyValid" | "totalOmzetValid" | "profitSetelahPenyesuaian"
  | "itemCount" | "waktuPesananDibuat"
> | "actions";

const SORTABLE_COLUMNS: ColumnKey[] = ["waktuPesananDibuat", "totalOmzetValid", "profitSetelahPenyesuaian"];

interface ColumnDef<T> {
  key: ColumnKey;
  label: string;
  width?: string;
  align?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

const COLUMNS: ColumnDef<OrderHeader>[] = [
  {
    key: "noPesanan",
    label: "No. Pesanan",
    width: "w-40",
    render: (value, row) => (
      <Link
        href={`/orders/${(row as OrderHeader & { noPesanan: string }).noPesanan}`}
        className="text-primary hover:underline font-mono text-xs"
      >
        {value as string}
      </Link>
    ),
  },
  { key: "usernamePembeli", label: "Pembeli", width: "w-36" },
  { key: "statusOrderFinal", label: "Status Order", width: "w-36" },
  { key: "statusHpp", label: "Status HPP", width: "w-32" },
  { key: "statusIncome", label: "Status Income", width: "w-32" },
  { key: "totalQtyValid", label: "Qty Valid", width: "w-16 text-right" },
  { key: "totalOmzetValid", label: "Omzet Valid", width: "w-28 text-right" },
  { key: "profitSetelahPenyesuaian", label: "Profit", width: "w-28 text-right" },
  { key: "itemCount", label: "Items", width: "w-16 text-center" },
  { key: "waktuPesananDibuat", label: "Tanggal", width: "w-36" },
  { key: "actions", label: "", width: "w-10" },
];

/* ─── Sort Helper ─── */

function sortData(data: OrderHeader[], key: string, dir: "asc" | "desc"): OrderHeader[] {
  const sorted = [...data];
  sorted.sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    switch (key) {
      case "totalOmzetValid":
      case "profitSetelahPenyesuaian":
      case "totalQtyValid":
      case "itemCount":
        aVal = a[key as keyof OrderHeader] as number;
        bVal = b[key as keyof OrderHeader] as number;
        return dir === "asc" ? aVal - bVal : bVal - aVal;
      case "waktuPesananDibuat":
        aVal = a.waktuPesananDibuat || "";
        bVal = b.waktuPesananDibuat || "";
        return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      default:
        aVal = String(a[key as keyof OrderHeader] ?? "");
        bVal = String(b[key as keyof OrderHeader] ?? "");
        return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
  });
  return sorted;
}

/* ─── OrderListTable Component ─── */

export default function OrderListTable({
  initialData,
  initialSearch,
  initialStatus,
  initialStatusHpp,
  initialStatusIncome,
  initialDateFrom,
  initialDateTo,
}: {
  initialData: OrderListResult;
  initialSearch: string;
  initialStatus?: string;
  initialStatusHpp?: string;
  initialStatusIncome?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
}) {
  const [data, setData] = useState<OrderHeader[]>(initialData.headers);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  const [statusHppFilter, setStatusHppFilter] = useState(initialStatusHpp || "all");
  const [statusIncomeFilter, setStatusIncomeFilter] = useState(initialStatusIncome || "all");
  const [dateFrom, setDateFrom] = useState(initialDateFrom || "");
  const [dateTo, setDateTo] = useState(initialDateTo || "");
  const [sortKey, setSortKey] = useState<string>("waktuPesananDibuat");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  const applyFiltersAndSort = useCallback(
    (items: OrderHeader[]) => {
      let result = [...items];

      // Apply sort
      result = sortData(result, sortKey, sortDir);

      return result;
    },
    [sortKey, sortDir],
  );

  const fetchOrders = async (
    searchVal: string,
    statusVal: string,
    statusHppVal: string,
    statusIncomeVal: string,
    dateFromVal: string,
    dateToVal: string,
    pageNum: number,
  ) => {
    setIsLoading(true);
    const filter: Record<string, unknown> = {
      page: pageNum,
      pageSize,
      search: searchVal || undefined,
    };
    if (statusVal && statusVal !== "all") {
      filter["statusOrderFinal"] = statusVal;
    }
    if (statusHppVal && statusHppVal !== "all") {
      filter["statusHpp"] = statusHppVal;
    }
    if (statusIncomeVal && statusIncomeVal !== "all") {
      filter["statusIncome"] = statusIncomeVal;
    }
    if (dateFromVal) {
      filter["dateFrom"] = dateFromVal;
    }
    if (dateToVal) {
      filter["dateTo"] = dateToVal;
    }

    const result = await getOrdersAction(filter);
    setData(applyFiltersAndSort(result.headers));
    setTotal(result.total);
    setPage(result.page);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync local data when sort/filter state changes
  useEffect(() => {
    setData((prev) => applyFiltersAndSort(prev));
  }, [sortKey, sortDir, applyFiltersAndSort]);

  const handleSearch = async (value: string) => {
    setSearch(value);
    await fetchOrders(value, statusFilter, statusHppFilter, statusIncomeFilter, dateFrom, dateTo, 1);
  };

  const handleStatusChange = async (value: string) => {
    setStatusFilter(value);
    await fetchOrders(search, value, statusHppFilter, statusIncomeFilter, dateFrom, dateTo, 1);
  };

  const handleStatusHppChange = async (value: string) => {
    setStatusHppFilter(value);
    await fetchOrders(search, statusFilter, value, statusIncomeFilter, dateFrom, dateTo, 1);
  };

  const handleStatusIncomeChange = async (value: string) => {
    setStatusIncomeFilter(value);
    await fetchOrders(search, statusFilter, statusHppFilter, value, dateFrom, dateTo, 1);
  };

  const handleDateFromChange = async (value: string) => {
    setDateFrom(value);
    await fetchOrders(search, statusFilter, statusHppFilter, statusIncomeFilter, value, dateTo, 1);
  };

  const handleDateToChange = async (value: string) => {
    setDateTo(value);
    await fetchOrders(search, statusFilter, statusHppFilter, statusIncomeFilter, dateFrom, value, 1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePageChange = async (newPage: number) => {
    await fetchOrders(search, statusFilter, statusHppFilter, statusIncomeFilter, dateFrom, dateTo, newPage);
  };

  const handleExportCsv = () => {
    if (data.length === 0) return;
    exportOrdersToCsv(data);
  };

  const activeFilterCount = [statusFilter, statusHppFilter, statusIncomeFilter, dateFrom, dateTo].filter(
    (v) => v && v !== "all",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Daftar Pesanan</h1>
            <p className="text-sm text-muted-foreground">
              {total} pesanan ditemukan
              {activeFilterCount > 0 && ` (${activeFilterCount} filter aktif)`}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={data.length === 0 || isLoading}
          >
            <Download className="size-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Order Filter */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status Order</Label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-44"
            >
              <option value="all">Semua Status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Status HPP Filter */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status HPP</Label>
            <select
              value={statusHppFilter}
              onChange={(e) => handleStatusHppChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-44"
            >
              <option value="all">Semua HPP</option>
              {HPP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Status Income Filter */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status Income</Label>
            <select
              value={statusIncomeFilter}
              onChange={(e) => handleStatusIncomeChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-44"
            >
              <option value="all">Semua Income</option>
              {INCOME_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="h-9 w-40"
              disabled={isLoading}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="h-9 w-40"
              disabled={isLoading}
            />
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="self-end mb-0.5"
              onClick={() => {
                setStatusFilter("all");
                setStatusHppFilter("all");
                setStatusIncomeFilter("all");
                setDateFrom("");
                setDateTo("");
                fetchOrders("", "all", "all", "all", "", "", 1);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Cari no. pesanan / pembeli..."
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className={cn(col.width, col.align)}>
                  {SORTABLE_COLUMNS.includes(col.key) ? (
                    <SortableHead
                      label={col.label}
                      sortKey={col.key}
                      currentSort={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id ?? row.noPesanan}>
              {COLUMNS.map((col) => (
                <TableCell key={col.key} className={cn(col.width, col.align)}>
                  {col.key === "actions" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget((row as OrderHeader & { noPesanan: string }).noPesanan)}
                      title="Hapus pesanan"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : col.render
                    ? col.render(row[col.key], row)
                    : col.key === "totalOmzetValid" || col.key === "profitSetelahPenyesuaian"
                      ? formatRupiah(row[col.key] as number)
                      : col.key === "waktuPesananDibuat"
                        ? formatDate(row.waktuPesananDibuat)
                        : col.key === "statusOrderFinal" ||
                            col.key === "statusHpp" ||
                            col.key === "statusIncome"
                          ? <StatusBadge value={String(row[col.key])} />
                          : col.key === "totalQtyValid" || col.key === "itemCount"
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
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">Tidak ada pesanan</p>
          <p className="text-xs mt-1">
            {search || statusFilter !== "all" || statusHppFilter !== "all" || statusIncomeFilter !== "all" || dateFrom || dateTo
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Belum ada pesanan yang di-import"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} &middot; {total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
              {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => handlePageChange(page + 1)}
            >
              Selanjutnya
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      <DeleteOrderDialog
        noPesanan={deleteTarget || ""}
        open={!!deleteTarget}
        onOpenChange={(open) => setDeleteTarget(open ? deleteTarget : null)}
        onDeleted={() => {
          setData((prev) => prev.filter((h) => h.noPesanan !== deleteTarget));
          setTotal((prev) => Math.max(0, prev - 1));
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
