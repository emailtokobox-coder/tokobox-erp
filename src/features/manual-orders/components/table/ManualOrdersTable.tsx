"use client"

import { useState, useRef } from "react";

/**
 * @module features/manual-orders/components/ManualOrdersTable
 * Manual Orders Table — searchable, filterable, paginated table of manual orders.
 *
 *
 * Architecture:
 *   ManualOrdersTable (client) → getManualOrdersAction → ManualOrderSupabaseRepository → Supabase
 *
 * Follows same pattern as OrderListTable.tsx in features/orders.
 */


import { Search, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ErrorState } from "@/components/ui/error-state";
import {
  getManualOrdersAction,
  type ManualOrderListResult,
} from "@/features/manual-orders/actions";
import {
  MANUAL_ORDER_TYPES,
  MANUAL_ORDER_STATUSES,
  type ManualOrderType,
  type ManualOrderStatus,
} from "@/features/manual-orders/constants/manualOrderStatus";
import type { ManualOrder } from "@/features/manual-orders/types/ManualOrder";

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
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ─── Status Badge ─── */

function ManualOrderStatusBadge({ value }: { value: ManualOrderStatus }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  const completedStatuses: ManualOrderStatus[] = [
    "Lunas",
    "Selesai",
    "DP_Lunas",
    "Pelunasan_Diterima",
  ];

  const pendingStatuses: ManualOrderStatus[] = [
    "Draft",
    "Invoice_Terkirim",
    "Menunggu_Pembayaran_DP",
    "Pelunasan_Diminta",
    "ACC_Termin",
    "Kirim_Invoice_Tagihan",
  ];

  const activeStatuses: ManualOrderStatus[] = [
    "Produksi",
    "Siap_Kirim",
    "Terkirim",
  ];

  if (completedStatuses.includes(value)) {
    variant = "default";
  } else if (pendingStatuses.includes(value)) {
    variant = "secondary";
  } else if (activeStatuses.includes(value)) {
    variant = "outline";
  }

  const label =
    value === "Invoice_Terkirim"
      ? "Invoice Terkirim"
      : value === "Menunggu_Pembayaran_DP"
        ? "Menunggu DP"
        : value === "Pelunasan_Diminta"
          ? "Minta Pelunasan"
        : value === "Pelunasan_Diterima"
          ? "Pelunasan Diterima"
          : value === "Kirim_Invoice_Tagihan"
            ? "Kirim Tagihan"
            : value;

  return <Badge variant={variant}>{label}</Badge>;
}

/* ─── Tipe Badge ─── */

function TipeBadge({ tipe }: { tipe: ManualOrderType }) {
  const colors: Record<ManualOrderType, string> = {
    MANUAL_CASH: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    MANUAL_DP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    MANUAL_TERMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const labels: Record<ManualOrderType, string> = {
    MANUAL_CASH: "Cash",
    MANUAL_DP: "DP",
    MANUAL_TERMIN: "Termin",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[tipe]
      )}
    >
      {labels[tipe]}
    </span>
  );
}

/* ─── cn helper ─── */

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── ManualOrdersTable Component ─── */

interface ManualOrdersTableProps {
  initialData: ManualOrderListResult;
}

export default function ManualOrdersTable({
  initialData,
}: ManualOrdersTableProps) {
  const [data, setData] = useState<ManualOrder[]>(initialData.orders);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipeFilter, setTipeFilter] = useState<ManualOrderType | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] =
    useState<ManualOrderStatus | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchOrders = async (
    searchVal: string,
    tipeVal: ManualOrderType | "all",
    statusVal: ManualOrderStatus | "all",
    pageNum: number
  ) => {
    setIsLoading(true);
    setActionError(null);
    try {
      const filter: Record<string, unknown> = {
        page: pageNum,
        pageSize,
        search: searchVal || undefined,
      };
      if (tipeVal && tipeVal !== "all") {
        filter["tipe"] = tipeVal;
      }
      if (statusVal && statusVal !== "all") {
        filter["status"] = statusVal;
      }
      const result = await getManualOrdersAction(filter);
      setData(result.orders);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data pesanan";
      setActionError(message);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = async (value: string) => {
    setSearch(value);
    await fetchOrders(value, tipeFilter, statusFilter, 1);
  };

  const handleTipeChange = async (value: string) => {
    const tipe = value as ManualOrderType | "all";
    setTipeFilter(tipe);
    await fetchOrders(search, tipe, statusFilter, 1);
  };

  const handleStatusChange = async (value: string) => {
    const status = value as ManualOrderStatus | "all";
    setStatusFilter(status);
    await fetchOrders(search, tipeFilter, status, 1);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading) return;
    await fetchOrders(search, tipeFilter, statusFilter, newPage);
  };

  // Expose refresh function via ref to parent (used after create/edit on detail page)
  const refreshRef = useRef<(() => void) | null>(null)
  refreshRef.current = () => {
    fetchOrders(search, tipeFilter, statusFilter, page).catch(() => {
      // silent — error state handled by setActionError in fetchOrders
    })
  }

  // Expose via global callback for optimistic updates from other pages
  if (typeof window !== "undefined") {
    const win = window as unknown as { __manualOrdersRefresh?: () => void }
    win.__manualOrdersRefresh = () => {
      refreshRef.current?.()
    }
  }

  return (    <div className="space-y-4">
      {/* Error Banner — shown when a fetch fails */}
      {actionError && (
        <ErrorState
          variant="card"
          title="Gagal memuat pesanan"
          description={actionError}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(search, tipeFilter, statusFilter, page)}
              className="gap-1.5"
            >
              <RefreshCw className="size-4" />
              Coba Lagi
            </Button>
          }
        />
      )}
      {/* Header with title + create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pesanan Manual
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} pesanan manual
          </p>
        </div>

        <Link
          href="/manual-orders/new"
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-9 rounded-md px-4 py-2"
        >
          <Plus className="size-4 mr-1.5" />
          Pesanan Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={tipeFilter}
          onChange={(e) => handleTipeChange(e.target.value)}
          disabled={isLoading}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-44"
        >
          <option value="all">Semua Tipe</option>
          {MANUAL_ORDER_TYPES.map((tipe) => (
            <option key={tipe} value={tipe}>
              {tipe === "MANUAL_CASH"
                ? "Cash"
                : tipe === "MANUAL_DP"
                  ? "DP"
                  : "Termin"}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isLoading}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-48"
        >
          <option value="all">Semua Status</option>
          {MANUAL_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "Invoice_Terkirim"
                ? "Invoice Terkirim"
                : status === "Menunggu_Pembayaran_DP"
                  ? "Menunggu DP"
                  : status === "Pelunasan_Diminta"
                    ? "Minta Pelunasan"
                    : status === "Pelunasan_Diterima"
                      ? "Pelunasan Diterima"
                      : status === "Kirim_Invoice_Tagihan"
                        ? "Kirim Tagihan"
                        : status}
            </option>
          ))}
        </select>

        <div className="relative w-64 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Cari no. order / pelanggan..."
            defaultValue={search}
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
            <TableHead className="w-40">No. Order</TableHead>
            <TableHead className="w-36">Pelanggan</TableHead>
            <TableHead className="w-28">Tipe</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="w-32 text-right">Total</TableHead>
            <TableHead className="w-28">Bayar</TableHead>
            <TableHead className="w-28">Ekspedisi</TableHead>
            <TableHead className="w-28">Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id ?? order.noManualOrder}>
              <TableCell>
                <Link
                  href={`/manual-orders/${order.id ?? order.noManualOrder}`}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {order.noManualOrder}
                </Link>
              </TableCell>
              <TableCell>
                <span className="truncate block max-w-[140px]" title={order.namaPelanggan}>
                  {order.namaPelanggan}
                </span>
              </TableCell>
              <TableCell>
                <TipeBadge tipe={order.tipePesanan} />
              </TableCell>
              <TableCell>
                <ManualOrderStatusBadge value={order.statusOrder} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatRupiah(order.total)}
              </TableCell>
              <TableCell>
                <span className="capitalize text-xs">
                  {order.metodePembayaran}
                </span>
              </TableCell>
              <TableCell>
                <span className="truncate block max-w-[100px] text-xs" title={order.ekspedisi}>
                  {order.ekspedisi || "-"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(order.createdAt || "")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">
            {search || tipeFilter !== "all" || statusFilter !== "all"
              ? "Tidak ada pesanan yang cocok"
              : "Belum ada pesanan manual"}
          </p>
          <p className="text-xs mt-1">
            {search || tipeFilter !== "all" || statusFilter !== "all"
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Buat pesanan manual baru untuk memulai"}
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
              <ChevronLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
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
    </div>
  );
}
