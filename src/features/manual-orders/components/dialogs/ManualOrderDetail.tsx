"use client"

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * @module features/manual-orders/components/dialogs/ManualOrderDetail
 * Manual Order Detail Page — tabbed view with status flow, payment tracking, print actions.
 *
 *
 * Architecture:
 *   ManualOrderDetail (client) ← getManualOrderDetailAction ← Supabase
 *
 * Per PRD 7.9:
 *   - StatusFlow: visual progression through tipe-specific status pipeline
 *   - Detail tab: Order info + items table
 *   - Pembayaran tab: Payment tracking with confirmation (DP/Termin)
 *   - Resi tab: Input no resi, ekspedisi, bukti foto
 *   - WhatsApp tab: Send WA messages + log history
 *   - Print actions: Invoice (A4), Label (A6), Surat Jalan (A4)
 */


import { useRouter } from "next/navigation"
import { ArrowLeft, Send, FileText, Truck, MessageCircle, Plus, Printer, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  updateManualOrderAction,
  sendWhatsAppAction,
  addResiDataAction,
  type ManualOrder,
  type ManualOrderItem,
  type DpPayment,
  type TerminPayment,
  type ResiData,
  type WhatsAppLog,
  type ManualOrderStatus,
} from "@/features/manual-orders"
import StatusFlow from "./StatusFlow"
import PaymentTracking from "./PaymentTracking"
import { WHATSAPP_TYPES } from "@/features/manual-orders/constants/manualOrderStatus"
import type { ManualOrderType } from "@/features/manual-orders/constants/manualOrderStatus"

/* ─── Format Helpers ─── */

function formatRupiah(value: number): string {
  if (value === 0) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

/* ─── Status Badge ─── */

function StatusBadge({ value }: { value: ManualOrderStatus }) {
  const completed: ManualOrderStatus[] = ["Lunas", "Selesai", "DP_Lunas", "Pelunasan_Diterima"]
  const pending: ManualOrderStatus[] = ["Draft", "Invoice_Terkirim", "Menunggu_Pembayaran_DP", "Pelunasan_Diminta", "ACC_Termin", "Kirim_Invoice_Tagihan"]

  let variant: "default" | "secondary" | "outline" = "outline"
  if (completed.includes(value)) variant = "default"
  else if (pending.includes(value)) variant = "secondary"

  const label =
    value === "Invoice_Terkirim" ? "Invoice Terkirim"
    : value === "Menunggu_Pembayaran_DP" ? "Menunggu DP"
    : value === "Pelunasan_Diminta" ? "Minta Pelunasan"
    : value === "Pelunasan_Diterima" ? "Pelunasan Diterima"
    : value === "Kirim_Invoice_Tagihan" ? "Kirim Tagihan"
    : value

  return <Badge variant={variant}>{label}</Badge>
}

/* ─── Tipe Badge ─── */

function TipeBadge({ tipe }: { tipe: ManualOrderType }) {
  const colors: Record<ManualOrderType, string> = {
    MANUAL_CASH: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    MANUAL_DP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    MANUAL_TERMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  }
  const labels: Record<ManualOrderType, string> = { MANUAL_CASH: "Cash", MANUAL_DP: "DP", MANUAL_TERMIN: "Termin" }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colors[tipe])}>
      {labels[tipe]}
    </span>
  )
}

/* ─── Info Row ─── */

function InfoRow({ label, value, fullWidth = false }: { label: string; value: ReactNode; fullWidth?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5", fullWidth && "md:col-span-2")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

/* ─── ManualOrderDetail Component ─── */

interface ManualOrderDetailProps {
  order: ManualOrder | null
  items: ManualOrderItem[]
  dpPayments: DpPayment[]
  terminPayments: TerminPayment[]
  resi: ResiData | null
  whatsappLogs: WhatsAppLog[]
  orderId: string
  onRefresh?: () => void
}

export default function ManualOrderDetail({
  order,
  items,
  dpPayments,
  terminPayments,
  resi,
  whatsappLogs,
  orderId,
  onRefresh,
}: ManualOrderDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("detail")
  const [refreshing, setRefreshing] = useState(false)

  // WhatsApp send state
  const [sendingWa, setSendingWa] = useState(false)
  const [waType, setWaType] = useState<"INVOICE" | "RESI" | "PELUNASAN" | "FOLLOW_UP" | "DP_REQUEST">("INVOICE")

  // Resi form state
  const [resiNo, setResiNo] = useState("")
  const [resiEkspedisi, setResiEkspedisi] = useState("")
  const [resiTanggal, setResiTanggal] = useState("")
  const [addingResi, setAddingResi] = useState(false)

  const handleStatusChange = async (newStatus: ManualOrderStatus) => {
    setRefreshing(true)
    try {
      await updateManualOrderAction(orderId, { statusOrder: newStatus })
      onRefresh?.()
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendWhatsApp = async () => {
    setSendingWa(true)
    try {
      await sendWhatsAppAction(orderId, waType)
      onRefresh?.()
    } finally {
      setSendingWa(false)
    }
  }

  const handleAddResi = async () => {
    if (!resiNo || !resiEkspedisi) return
    setAddingResi(true)
    try {
      await addResiDataAction({
        manualOrderId: orderId,
        noResi: resiNo,
        ekspedisi: resiEkspedisi,
        tanggalKirim: resiTanggal || new Date().toISOString().split("T")[0],
      })
      setResiNo("")
      setResiEkspedisi("")
      setResiTanggal("")
      onRefresh?.()
    } finally {
      setAddingResi(false)
    }
  }

  // Print actions
  const handlePrint = (type: "invoice" | "label" | "surat-jalan") => {
    const printWindow = window.open("", "_blank")
    if (!printWindow || !order) return

    const isDark = document.documentElement.classList.contains("dark")
    const bg = isDark ? "#0a0a0a" : "#ffffff"
    const fg = isDark ? "#fafafa" : "#0a0a0a"
    const muted = isDark ? "#a3a3a3" : "#737373"
    const border = isDark ? "#262626" : "#e5e5e5"

    let content = ""
    const no = order.noManualOrder
    const tgl = formatDate(order.createdAt || "")
    const cust = order.namaPelanggan
    const alamat = order.alamat || "-"
    const hp = order.noHp
    const ekspedisi = order.ekspedisi || "-"
    const subtotal = formatRupiah(order.subtotal)
    const diskon = formatRupiah(order.diskonNominal)
    const pajak = formatRupiah(order.pajak)
    const ongkir = formatRupiah(order.biayaOngkir)
    const total = formatRupiah(order.total)
    const catatan = order.catatan || "-"

    if (type === "invoice") {
      content = `
        <div style="font-family: system-ui, sans-serif; color: ${fg}; background: ${bg}; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">INVOICE</h1>
          <p style="color: ${muted}; font-size: 14px; margin-bottom: 24px;">No: ${no} &nbsp;|&nbsp; Tanggal: ${tgl}</p>
          <hr style="border-color: ${border}; margin-bottom: 24px;" />
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Pelanggan</h2>
          <p style="font-size: 14px; margin-bottom: 4px;"><strong>${cust}</strong></p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 4px;">${alamat}</p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 24px;">No. HP: ${hp}</p>
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Detail Pesanan</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead><tr style="border-bottom: 2px solid ${border};">
              <th style="text-align: left; padding: 8px;">Produk</th>
              <th style="text-align: right; padding: 8px;">Qty</th>
              <th style="text-align: right; padding: 8px;">Harga</th>
              <th style="text-align: right; padding: 8px;">Subtotal</th>
            </tr></thead>
            <tbody>${items.map(item => `<tr style="border-bottom: 1px solid ${border};">
              <td style="padding: 8px;">${item.namaProduk}</td>
              <td style="text-align: right; padding: 8px;">${item.qty}</td>
              <td style="text-align: right; padding: 8px;">${formatRupiah(item.hargaSatuan)}</td>
              <td style="text-align: right; padding: 8px;">${formatRupiah(item.subtotal)}</td>
            </tr>`).join("")}</tbody>
          </table>
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 300px; font-size: 14px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Subtotal</span><span>${subtotal}</span></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Diskon</span><span>- ${diskon}</span></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Pajak</span><span>+ ${pajak}</span></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Ongkir</span><span>+ ${ongkir}</span></div>
              <hr style="border-color: ${border}; margin: 8px 0;" />
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;"><span>TOTAL</span><span>${total}</span></div>
            </div>
          </div>
          <p style="margin-top: 40px; font-size: 12px; color: ${muted};">Catatan: ${catatan}</p>
          <p style="margin-top: 8px; font-size: 12px; color: ${muted};">Ekspedisi: ${ekspedisi}</p>
        </div>`
    } else if (type === "label") {
      content = `
        <div style="font-family: system-ui, sans-serif; color: ${fg}; background: ${bg}; padding: 20px; width: 400px; margin: 0 auto;">
          <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 12px;">LABEL PENGIRIMAN</h1>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 16px;">${no}</p>
          <hr style="border-color: ${border}; margin-bottom: 16px;" />
          <p style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${cust}</p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 4px;">${alamat}</p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 4px;">No. HP: ${hp}</p>
          <p style="font-size: 14px; margin-bottom: 16px;"><strong>Ekspedisi:</strong> ${ekspedisi}</p>
          <div style="border: 2px dashed ${border}; padding: 12px; text-align: center; font-size: 12px; color: ${muted};">
            TOTAL: ${total}
          </div>
        </div>`
    } else if (type === "surat-jalan") {
      content = `
        <div style="font-family: system-ui, sans-serif; color: ${fg}; background: ${bg}; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">SURAT JALAN</h1>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 24px;">No: ${no} &nbsp;|&nbsp; Tanggal: ${tgl}</p>
          <hr style="border-color: ${border}; margin-bottom: 24px;" />
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Kepada Yth.</h2>
          <p style="font-size: 14px; margin-bottom: 4px;"><strong>${cust}</strong></p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 4px;">${alamat}</p>
          <p style="font-size: 14px; color: ${muted}; margin-bottom: 24px;">No. HP: ${hp}</p>
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Detail Barang</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead><tr style="border-bottom: 2px solid ${border};">
              <th style="text-align: left; padding: 8px;">Produk</th>
              <th style="text-align: center; padding: 8px;">Qty</th>
              <th style="text-align: right; padding: 8px;">Berat</th>
            </tr></thead>
            <tbody>${items.map(item => `<tr style="border-bottom: 1px solid ${border};">
              <td style="padding: 8px;">${item.namaProduk}</td>
              <td style="text-align: center; padding: 8px;">${item.qty}</td>
              <td style="text-align: right; padding: 8px;">${(item.beratGram || 0).toLocaleString("id-ID")} gr</td>
            </tr>`).join("")}</tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="text-align: center; font-size: 12px; color: ${muted};">
              <p>Dibuat oleh,</p>
              <p style="margin-top: 40px;">_________________</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: ${muted};">
              <p>Diterima oleh,</p>
              <p style="margin-top: 40px;">_________________</p>
            </div>
          </div>
        </div>`
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${type} — ${no}</title></head><body>${content}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Not-found state
  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" />
          Kembali
        </Button>
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm font-medium">Pesanan manual tidak ditemukan</p>
          <p className="text-xs mt-1">
            No. Order "{orderId}" tidak ada di database
          </p>
        </div>
      </div>
    )
  }

  // Calculate totals from items
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)
  const totalBerat = items.reduce((sum, item) => sum + (item.beratGram || 0) * item.qty, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" />
          Kembali
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Detail Pesanan Manual</h1>
          <p className="text-sm text-muted-foreground font-mono">{order.noManualOrder}</p>
        </div>
        <div className="flex items-center gap-2">
          <TipeBadge tipe={order.tipePesanan} />
          <StatusBadge value={order.statusOrder} />
        </div>
      </div>

      {/* Status Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Alur Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusFlow order={order} onStatusChange={handleStatusChange} />
        </CardContent>
      </Card>

      {/* Print Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handlePrint("invoice")}>
              <Printer className="size-4 mr-1.5" />
              Print Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePrint("label")}>
              <Printer className="size-4 mr-1.5" />
              Print Label
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePrint("surat-jalan")}>
              <Package className="size-4 mr-1.5" />
              Surat Jalan
            </Button>
            {refreshing && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memperbarui...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail"><FileText className="size-4 mr-1.5" />Detail</TabsTrigger>
          <TabsTrigger value="pembayaran"><Send className="size-4 mr-1.5" />Pembayaran</TabsTrigger>
          <TabsTrigger value="resi"><Truck className="size-4 mr-1.5" />Resi</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="size-4 mr-1.5" />WhatsApp</TabsTrigger>
        </TabsList>

        {/* ─── Detail Tab ─── */}
        <TabsContent value="detail">
          <div className="space-y-4">
            {/* Order Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoRow label="No. Order" value={order.noManualOrder} fullWidth />
                  <InfoRow label="Tipe" value={<TipeBadge tipe={order.tipePesanan} />} />
                  <InfoRow label="Status" value={<StatusBadge value={order.statusOrder} />} />
                  <InfoRow label="Tanggal" value={formatDate(order.createdAt || order.tanggal || "")} />
                  <InfoRow label="Pelanggan" value={order.namaPelanggan} fullWidth />
                  <InfoRow label="Alamat" value={order.alamat || "-"} fullWidth />
                  <InfoRow label="No. HP" value={order.noHp} />
                  <InfoRow label="Ekspedisi" value={order.ekspedisi || "-"} />
                  <InfoRow label="Metode Bayar" value={<span className="capitalize">{order.metodePembayaran}</span>} />
                  <InfoRow label="Diskon" value={`${order.diskonPersen}% (${formatRupiah(order.diskonNominal)})`} />
                  <InfoRow label="Pajak" value={formatRupiah(order.pajak)} />
                  <InfoRow label="Ongkir" value={formatRupiah(order.biayaOngkir)} />
                  <InfoRow label="Total Qty" value={totalQty} />
                  <InfoRow label="Total Berat" value={`${totalBerat.toLocaleString("id-ID")} gr`} />
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
                  <InfoRow label="Subtotal" value={formatRupiah(order.subtotal)} />
                  <InfoRow label="Diskon" value={formatRupiah(order.diskonNominal)} />
                  <InfoRow label="Pajak" value={formatRupiah(order.pajak)} />
                  <InfoRow label="Ongkir" value={formatRupiah(order.biayaOngkir)} />
                  <InfoRow label="Total Harga" value={formatRupiah(order.total)} fullWidth />
                  <InfoRow label="Total Bayar" value={formatRupiah(order.totalBayar)} fullWidth />
                  <InfoRow label="Sisa Bayar" value={formatRupiah(order.sisaPembayaran)} fullWidth />
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Item ({items.length})</CardTitle>
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
                          <TableHead>Nama Produk</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Berat (gr)</TableHead>
                          <TableHead className="text-right">Harga Satuan</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id || item.namaProduk}>
                            <TableCell>{item.namaProduk}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">{(item.beratGram || 0).toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-right">{formatRupiah(item.hargaSatuan)}</TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Pembayaran Tab ─── */}
        <TabsContent value="pembayaran">
          <PaymentTracking
            dpPayments={dpPayments}
            terminPayments={terminPayments}
            tipePesanan={order.tipePesanan}
            onUpdate={onRefresh}
          />
        </TabsContent>

        {/* ─── Resi Tab ─── */}
        <TabsContent value="resi">
          <div className="space-y-4">
            {/* Existing Resi */}
            {resi && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Resi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoRow label="No. Resi" value={resi.noResi} fullWidth />
                    <InfoRow label="Ekspedisi" value={resi.ekspedisi} />
                    <InfoRow label="Tanggal Kirim" value={formatDate(resi.tanggalKirim)} />
                    <InfoRow label="Terkirim WA" value={resi.resiTerkirimWp ? "Ya" : "Belum"} />
                    {resi.buktiFoto && (
                      <InfoRow label="Bukti Foto" value={
                        <a href={resi.buktiFoto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          Lihat Foto
                        </a>
                      } fullWidth />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!resi && (
              <Card>
                <CardContent>
                  <div className="py-8 text-center text-muted-foreground">
                    <Truck className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Belum ada data resi</p>
                    <p className="text-xs mt-1">Input no. resi dan ekspedisi untuk pesanan ini</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Resi Form */}
            <Card>
              <CardHeader>
                <CardTitle>Tambah Resi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    value={resiNo}
                    onChange={(e) => setResiNo(e.target.value)}
                    placeholder="No. Resi"
                    className="h-10"
                  />
                  <Input
                    value={resiEkspedisi}
                    onChange={(e) => setResiEkspedisi(e.target.value)}
                    placeholder="Ekspedisi"
                    className="h-10"
                  />
                  <Input
                    type="date"
                    value={resiTanggal}
                    onChange={(e) => setResiTanggal(e.target.value)}
                    className="h-10"
                  />
                  <Button onClick={handleAddResi} disabled={addingResi || !resiNo || !resiEkspedisi} size="sm">
                    {addingResi ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Menyimpan...
                      </span>
                    ) : (
                      <><Plus className="size-4 mr-1" />Tambah</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── WhatsApp Tab ─── */}
        <TabsContent value="whatsapp">
          <div className="space-y-4">
            {/* Send WA */}
            <Card>
              <CardHeader>
                <CardTitle>Kirim WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <select
                    value={waType}
                    onChange={(e) => setWaType(e.target.value as "INVOICE" | "RESI" | "PELUNASAN" | "FOLLOW_UP" | "DP_REQUEST")}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-48"
                  >
                    {WHATSAPP_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === "INVOICE" ? "Invoice"
                          : type === "RESI" ? "Resi"
                          : type === "PELUNASAN" ? "Pelunasan"
                          : type === "FOLLOW_UP" ? "Follow Up"
                          : "DP Request"}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleSendWhatsApp} disabled={sendingWa}>
                    {sendingWa ? (
                      <span className="inline-flex items-center gap-1.5"><span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Mengirim...</span>
                    ) : (
                      <><MessageCircle className="size-4 mr-1.5" />Kirim</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* WA Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat WhatsApp ({whatsappLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {whatsappLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Belum ada log WhatsApp</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Nomor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Waktu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {whatsappLogs.map((log) => (
                          <TableRow key={log.id || log.tipe + log.createdAt}>
                            <TableCell><Badge variant="outline">{log.tipe}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">{log.nomorWp}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "Terkirim" ? "default" : log.status === "Gagal" ? "destructive" : "secondary"}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(log.createdAt || "")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
