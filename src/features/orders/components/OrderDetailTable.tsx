"use client"

import { useState, useMemo } from "react";
import type { ReactNode } from "react";

/**
 * @module features/orders/components/OrderDetailTable
 * Order Detail Table — displays order header info + items table for a single order.
 *
 *
 * Architecture:
 *   OrderDetailTable ← getOrderDetailAction ← Supabase "orders" + "order_items"
 */


import { ArrowLeft, ChevronUp, ChevronDown, Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOrderAction } from "../actions";
import type { OrderHeader, OrderItem, IncomeRecord, AdjustmentRecord } from "../types/OrderItem";

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

function exportItemsToCsv(items: OrderItem[], noPesanan: string): void {
  const headers = [
    "SKU", "Nama Produk", "Variasi", "Qty Order", "Qty Return", "Qty Valid",
    "Harga Per Qty", "Omzet Valid", "Omzet Retur", "HPP Valid", "HPP Retur", "Status Item",
  ];
  const rows = items.map((item) => [
    item.sku,
    `"${item.namaProduk.replace(/"/g, '""')}"`,
    `"${item.namaVariasi.replace(/"/g, '""')}"`,
    item.qtyOrder,
    item.qtyReturn,
    item.qtyValid,
    item.hargaPerQty,
    item.omzetValid,
    item.omzetRetur,
    item.hppValid,
    item.hppRetur,
    item.statusItem,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pesanan-${noPesanan}-items.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─── Status Badge Helper ─── */

function statusBadgeVariant(value: string): "default" | "success" | "warning" | "destructive" {
  if (value.includes("Normal") || value.includes("Cocok") || value.includes("Dihitung") || value.includes("Lengkap")) {
    return "success";
  }
  if (value.includes("Retur") || value.includes("Sebagian") || value.includes("Belum")) {
    return "warning";
  }
  if (value.includes("Batal") || value.includes("Kosong") || value.includes("Tidak")) {
    return "destructive";
  }
  return "default";
}

/* ─── Info Row ─── */

function InfoRow({ label, value, fullWidth = false }: { label: string; value: ReactNode; fullWidth?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5", fullWidth && "col-span-full")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/* ─── OrderDetailTable Component ─── */

export default function OrderDetailTable({
  header,
  items,
  income,
  adjustments,
  noPesanan,
}: {
  header: OrderHeader | null;
  items: OrderItem[];
  income: IncomeRecord | null;
  adjustments: AdjustmentRecord[];
  noPesanan: string;
}) {
  const router = useRouter();

  // Sort state
  const [sortKey, setSortKey] = useState<string>("sku");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrderAction(noPesanan);
      router.push("/orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortKey) {
        case "qtyOrder": case "qtyReturn": case "qtyValid":
        case "hargaPerQty": case "omzetValid": case "omzetRetur":
        case "hppValid": case "hppRetur": case "profitSetelah":
          aVal = a[sortKey as keyof OrderItem] as number;
          bVal = b[sortKey as keyof OrderItem] as number;
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        default:
          aVal = String(a[sortKey as keyof OrderItem] ?? "");
          bVal = String(b[sortKey as keyof OrderItem] ?? "");
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });
    return sorted;
  }, [items, sortKey, sortDir]);

  if (!header) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" />
          Kembali
        </Button>
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">Pesanan tidak ditemukan</p>
          <p className="text-xs mt-1">
            No. Pesanan &ldquo;{noPesanan}&rdquo; tidak ada di database
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-1" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Detail Pesanan</h1>
            <p className="text-sm text-muted-foreground">{noPesanan}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="size-4 mr-1" />
          Hapus
        </Button>
      </div>

      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="No. Pesanan" value={header.noPesanan} />
            <InfoRow label="Status Order" value={<Badge variant={statusBadgeVariant(header.statusOrderFinal)}>{header.statusOrderFinal}</Badge>} />
            <InfoRow label="Status HPP" value={<Badge variant={statusBadgeVariant(header.statusHpp)}>{header.statusHpp}</Badge>} />
            <InfoRow label="Status Income" value={<Badge variant={statusBadgeVariant(header.statusIncome)}>{header.statusIncome}</Badge>} />
            <InfoRow label="Status Profit" value={<Badge variant={statusBadgeVariant(header.statusProfit)}>{header.statusProfit}</Badge>} />
            <InfoRow label="Tanggal" value={formatDate(header.waktuPesananDibuat)} />
            <InfoRow label="Pembeli" value={header.usernamePembeli} />
            <InfoRow label="Metode Pembayaran" value={header.metodePembayaran || "-"} />
            <InfoRow label="Ekspedisi" value={header.ekspedisi || "-"} />
            <InfoRow label="Kota" value={header.kota || "-"} />
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="Qty Order" value={header.totalQtyOrder} />
            <InfoRow label="Qty Return" value={header.totalQtyReturn} />
            <InfoRow label="Qty Valid" value={header.totalQtyValid} />
            <InfoRow label="Omzet Valid" value={formatRupiah(header.totalOmzetValid)} />
            <InfoRow label="Omzet Retur" value={formatRupiah(header.totalOmzetRetur)} />
            <InfoRow label="HPP Valid" value={formatRupiah(header.totalHppValid)} />
            <InfoRow label="HPP Retur" value={formatRupiah(header.totalHppRetur)} />
            <InfoRow label="Penyesuaian" value={formatRupiah(header.totalPenyesuaian)} />
            <InfoRow label="Profit Sebelum" value={formatRupiah(header.profitSebelumPenyesuaian)} />
            <InfoRow label="Profit Setelah" value={formatRupiah(header.profitSetelahPenyesuaian)} />
            <InfoRow label="Income Aktual" value={header.incomeAktual !== null ? formatRupiah(header.incomeAktual) : "-"} />
            <InfoRow label="Jumlah Item" value={header.itemCount} />
          </div>
        </CardContent>
      </Card>

      {/* Profit Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Omzet Valid</span>
              <span className="text-sm font-medium">{formatRupiah(header.totalOmzetValid)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-destructive">HPP Valid</span>
              <span className="text-sm font-medium text-destructive">- {formatRupiah(header.totalHppValid)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Profit Kotor</span>
              <span className="text-sm font-medium">{formatRupiah(header.totalOmzetValid - header.totalHppValid)}</span>
            </div>
            {income && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="text-sm font-medium text-green-600">+ {formatRupiah(income.totalPenghasilan)}</span>
              </div>
            )}
            {header.totalPenyesuaian > 0 && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Penyesuaian</span>
                <span className="text-sm font-medium text-destructive">- {formatRupiah(header.totalPenyesuaian)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 bg-muted/50 rounded-lg px-4 mt-2">
              <span className="text-sm font-semibold">Profit Setelah Penyesuaian</span>
              <span className={cn(
                "text-base font-bold",
                header.profitSetelahPenyesuaian >= 0 ? "text-green-600" : "text-destructive"
              )}>{formatRupiah(header.profitSetelahPenyesuaian)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Margin Profit</span>
              <span className="text-xs font-medium">
                {header.totalOmzetValid > 0
                  ? `${((header.profitSetelahPenyesuaian / header.totalOmzetValid) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Item ({items.length})</CardTitle>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportItemsToCsv(sortedItems, noPesanan)}
              >
                <Download className="size-4 mr-1" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Tidak ada item untuk pesanan ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "sku", label: "SKU", align: "text-left" },
                    { key: "namaProduk", label: "Nama Produk", align: "text-left" },
                    { key: "namaVariasi", label: "Variasi", align: "text-left" },
                    { key: "qtyOrder", label: "Qty Order", align: "text-right" },
                    { key: "qtyReturn", label: "Qty Return", align: "text-right" },
                    { key: "qtyValid", label: "Qty Valid", align: "text-right" },
                    { key: "hargaPerQty", label: "Harga/Qty", align: "text-right" },
                    { key: "omzetValid", label: "Omzet Valid", align: "text-right" },
                    { key: "omzetRetur", label: "Omzet Retur", align: "text-right" },
                    { key: "hppValid", label: "HPP Valid", align: "text-right" },
                    { key: "hppRetur", label: "HPP Retur", align: "text-right" },
                    { key: "profitSetelah", label: "Profit", align: "text-right" },
                    { key: "statusItem", label: "Status", align: "text-center" },
                  ].map((col) => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        col.align,
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                        sortKey === col.key && "text-primary font-medium"
                      )}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                        ) : (
                          <span className="size-3" />
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.id ?? item.sku}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell>{item.namaProduk}</TableCell>
                    <TableCell className="text-muted-foreground">{item.namaVariasi || "-"}</TableCell>
                    <TableCell className="text-right">{item.qtyOrder}</TableCell>
                    <TableCell className="text-right">{item.qtyReturn}</TableCell>
                    <TableCell className="text-right">{item.qtyValid}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.hargaPerQty)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.omzetValid)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.omzetRetur)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.hppValid)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.hppRetur)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      item.omzetValid - item.hppValid >= 0 ? "text-green-600" : "text-destructive"
                    )}>
                      {formatRupiah(item.omzetValid - item.hppValid)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusBadgeVariant(item.statusItem)}>{item.statusItem}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Income Section */}
      {income && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Metode Pembayaran" value={income.metodePembayaran} />
              <InfoRow label="Tanggal Dana Dilepaskan" value={formatDate(income.tanggalDanaDilepaskan)} />
              <InfoRow label="Harga Asli Produk" value={formatRupiah(income.hargaAsliProduk)} />
              <InfoRow label="Total Diskon Produk" value={formatRupiah(income.totalDiskonProduk)} />
              <InfoRow label="Pengembalian Dana" value={formatRupiah(income.pengembalianDana)} />
              <InfoRow label="Diskon dari Shopee" value={formatRupiah(income.diskonDariShopee)} />
              <InfoRow label="Voucher Penjual" value={formatRupiah(income.voucherPenjual)} />
              <InfoRow label="Ongkir Dibayar Pembeli" value={formatRupiah(income.ongkirDibayarPembeli)} />
              <InfoRow label="Gratis Ongkir Shopee" value={formatRupiah(income.gratisOngkirShopee)} />
              <InfoRow label="Biaya Administrasi" value={formatRupiah(income.biayaAdministrasi)} />
              <InfoRow label="Biaya Layanan" value={formatRupiah(income.biayaLayanan)} />
              <InfoRow label="Biaya Proses Pesanan" value={formatRupiah(income.biayaProsesPesanan)} />
              <InfoRow label="Biaya Komisi AMS" value={formatRupiah(income.biayaKomisiAms)} />
              <InfoRow label="Total Penghasilan" value={formatRupiah(income.totalPenghasilan)} fullWidth />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Section */}
      {adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Penyesuaian</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Biaya Penyesuaian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{formatDate(adj.tanggalAdjustment)}</TableCell>
                    <TableCell>{adj.tipeAdjustment}</TableCell>
                    <TableCell className="text-right">{formatRupiah(adj.biayaPenyesuaian)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Hapus Pesanan"
        description={`Yakin ingin menghapus pesanan "${noPesanan}"? Semua data order dan item akan dihapus permanen. Aksi ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
