"use client"

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * @module features/manual-orders/components/forms/ManualOrderForm
 * Manual Order Create/Edit Form — collects all order data with auto-calculation.
 *
 *
 * Architecture:
 *   ManualOrderForm (client) → createManualOrderAction / updateManualOrderAction → Supabase
 *
 * Per PRD 7.9:
 *   - Customer info: Nama Pelanggan, Alamat, No. HP, Ekspedisi
 *   - Order type: Cash / DP / Termin
 *   - Payment method: Cash / Transfer / QRIS
 *   - Items: Nama Produk, Qty, Harga Satuan, Berat (gram)
 *   - Financial: Diskon, Pajak, Ongkir — auto-calculate total
 *   - DP/Termin schedule (conditional)
 *   - Catatan
 */


import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  MANUAL_ORDER_TYPES,
  MANUAL_ORDER_STATUSES,
  PAYMENT_METHODS,
  type ManualOrderType,
  type ManualOrderStatus,
  type PaymentMethod,
} from "@/features/manual-orders"
import type { ManualOrder, ManualOrderItem, TerminPayment } from "@/features/manual-orders"

import { createManualOrderAction, updateManualOrderAction } from "@/features/manual-orders/actions";

/* ─── Props ─── */

interface ManualOrderFormProps {
  initialData?: ManualOrder | null
  submitLabel?: string
}

/* ─── Default item ─── */

const emptyItem = (): ManualOrderItem => ({
  namaProduk: "",
  qty: 1,
  hargaSatuan: 0,
  beratGram: 0,
  subtotal: 0,
})

const emptyTerminSchedule = (): TerminPayment => ({
  urutan: 1,
  tanggalJatuhTempo: "",
  persentase: 0,
  nominal: 0,
  metodePembayaran: "cash",
  status: "Pending",
  konfirmasiBukti: "",
  catatan: "",
})

/* ─── ManualOrderForm Component ─── */

export default function ManualOrderForm({
  initialData,
  submitLabel = "Simpan Pesanan",
}: ManualOrderFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Order number (read-only display)
  const noManualOrder = initialData?.noManualOrder || ""

  // Customer info
  const [namaPelanggan, setNamaPelanggan] = useState(initialData?.namaPelanggan || "")
  const [alamat, setAlamat] = useState(initialData?.alamat || "")
  const [noHp, setNoHp] = useState(initialData?.noHp || "")
  const [ekspedisi, setEkspedisi] = useState(initialData?.ekspedisi || "")

  // Order type & payment
  const [tipePesanan, setTipePesanan] = useState<ManualOrderType>(
    initialData?.tipePesanan || "MANUAL_CASH"
  )
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>(
    initialData?.metodePembayaran || "cash"
  )
  const [statusOrder, setStatusOrder] = useState<ManualOrderStatus>(
    initialData?.statusOrder || "Draft"
  )

  // Items
  const [items, setItems] = useState<ManualOrderItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [emptyItem()]
  )

  // Financial
  const [diskonPersen, setDiskonPersen] = useState(initialData?.diskonPersen || 0)
  const [diskonNominal, setDiskonNominal] = useState(initialData?.diskonNominal || 0)
  const [pajak, setPajak] = useState(initialData?.pajak || 0)
  const [biayaOngkir, setBiayaOngkir] = useState(initialData?.biayaOngkir || 0)

  // Notes
  const [catatan, setCatatan] = useState(initialData?.catatan || "")

  // DP schedule (only for MANUAL_DP)
  const [dpPersentase, setDpPersentase] = useState(initialData?.dpPersentase || 50)
  const [dpNominal, setDpNominal] = useState(initialData?.dpNominal || 0)

  // Termin schedule (only for MANUAL_TERMIN)
  const [terminSchedule, setTerminSchedule] = useState<TerminPayment[]>(
    initialData?.terminSchedule && initialData.terminSchedule.length > 0
      ? initialData.terminSchedule as unknown as TerminPayment[]
      : [emptyTerminSchedule()]
  )

  // ─── Calculations ───

  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const diskonAmount = diskonNominal || (subtotal > 0 ? Math.round(subtotal * diskonPersen / 100) : 0)
  const total = subtotal - diskonAmount + pajak + biayaOngkir
  const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0)
  const totalBerat = items.reduce((sum, item) => sum + (item.beratGram || 0) * (item.qty || 0), 0)

  // Auto-calculate DP nominal from percentage
  const calculatedDpNominal = dpPersentase > 0 ? Math.round(total * dpPersentase / 100) : 0

  // ─── Item handlers ───

  const updateItem = (index: number, field: keyof ManualOrderItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === "qty" || field === "hargaSatuan") {
        const qty = field === "qty" ? (value as number) : next[index].qty
        const harga = field === "hargaSatuan" ? (value as number) : next[index].hargaSatuan
        next[index].subtotal = qty * harga
      }
      return next
    })
  }

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // ─── DP schedule handlers ───

  const updateDpSchedule = (field: "persentase" | "nominal", value: string | number) => {
    if (field === "persentase") {
      setDpPersentase(value as number)
      setDpNominal(0)
    } else {
      setDpNominal(value as number)
    }
  }

  // ─── Termin schedule handlers ───

  const updateTerminRow = (index: number, field: keyof TerminPayment, value: string | number) => {
    setTerminSchedule((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addTerminRow = () => {
    setTerminSchedule((prev) => [
      ...prev,
      { ...emptyTerminSchedule(), urutan: prev.length + 1 },
    ])
  }

  const removeTerminRow = (index: number) => {
    setTerminSchedule((prev) =>
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, urutan: i + 1 }))
    )
  }

  // ─── Submit ───

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data: Partial<ManualOrder> = {
        noManualOrder: noManualOrder || undefined,
        namaPelanggan,
        alamat,
        noHp,
        ekspedisi,
        tipePesanan,
        metodePembayaran,
        statusOrder,
        items,
        diskonPersen,
        diskonNominal: diskonAmount,
        pajak,
        biayaOngkir,
        total,
        subtotal,
        totalBayar: tipePesanan === "MANUAL_CASH" ? total : 0,
        sisaPembayaran: tipePesanan === "MANUAL_CASH" ? 0 : total,
        catatan,
      }

      // Add DP schedule data
      if (tipePesanan === "MANUAL_DP") {
        data.dpPersentase = dpPersentase
        data.dpNominal = dpNominal || calculatedDpNominal
      }

      // Add Termin schedule data
      if (tipePesanan === "MANUAL_TERMIN") {
        data.terminSchedule = terminSchedule
          .filter((row) => row.tanggalJatuhTempo)
          .map((row) => ({
            tanggalJatuhTempo: row.tanggalJatuhTempo,
            persentase: row.persentase,
            nominal: row.nominal,
          }))
      }

      const isEdit = !!initialData?.id
      if (isEdit) {
        const result = await updateManualOrderAction(initialData.id!, data)
        if (result) {
          router.push(`/manual-orders/${result.id}`)
        }
      } else {
        const result = await createManualOrderAction(data)
        if (result) {
          router.push(`/manual-orders/${result.id}`)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-1" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {initialData ? "Edit Pesanan Manual" : "Pesanan Manual Baru"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {noManualOrder
              ? `No. ${noManualOrder}`
              : "Nomor pesanan akan dibuat otomatis"}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Nama Pelanggan *</label>
              <Input value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Alamat</label>
              <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">No. HP *</label>
              <Input value={noHp} onChange={(e) => setNoHp(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ekspedisi</label>
              <Input value={ekspedisi} onChange={(e) => setEkspedisi(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Type & Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Tipe Pesanan & Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipe Pesanan *</label>
              <select
                value={tipePesanan}
                onChange={(e) => setTipePesanan(e.target.value as ManualOrderType)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
              >
                {MANUAL_ORDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "MANUAL_CASH" ? "Cash" : t === "MANUAL_DP" ? "DP" : "Termin"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Metode Pembayaran *</label>
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as PaymentMethod)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m === "cash" ? "Cash" : m === "transfer" ? "Transfer" : "QRIS"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select
                value={statusOrder}
                onChange={(e) => setStatusOrder(e.target.value as ManualOrderStatus)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
              >
                {MANUAL_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DP Schedule — conditional for MANUAL_DP */}
      {tipePesanan === "MANUAL_DP" && (
        <Card>
          <CardHeader>
            <CardTitle>Jadwal DP (Down Payment)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Persentase DP (%) *</label>
                <Input
                  type="number"
                  value={dpPersentase || ""}
                  onChange={(e) => updateDpSchedule("persentase", Number(e.target.value) || 0)}
                  className="h-9"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nominal DP (Rp)</label>
                <Input
                  type="number"
                  value={dpNominal || ""}
                  onChange={(e) => updateDpSchedule("nominal", Number(e.target.value) || 0)}
                  className="h-9"
                  min={0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Otomatis: {formatRupiah(calculatedDpNominal)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
              <span className="text-muted-foreground">Sisa pelunasan: </span>
              <span className="font-medium">{formatRupiah(total - (dpNominal || calculatedDpNominal))}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Termin Schedule — conditional for MANUAL_TERMIN */}
      {tipePesanan === "MANUAL_TERMIN" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Jadwal Termin (Pembayaran Bertahap)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTerminRow}>
                <Plus className="size-4 mr-1" />
                Tambah Cicilan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {terminSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada jadwal termin. Klik "Tambah Cicilan" untuk menambahkan.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tanggal Jatuh Tempo</TableHead>
                      <TableHead className="text-right w-28">Persentase (%)</TableHead>
                      <TableHead className="text-right w-32">Nominal (Rp)</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terminSchedule.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center text-muted-foreground">{row.urutan}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.tanggalJatuhTempo || ""}
                            onChange={(e) => updateTerminRow(index, "tanggalJatuhTempo", e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={row.persentase || ""}
                            onChange={(e) => updateTerminRow(index, "persentase", Number(e.target.value) || 0)}
                            className="h-9 text-right w-20"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={row.nominal || ""}
                            onChange={(e) => updateTerminRow(index, "nominal", Number(e.target.value) || 0)}
                            className="h-9 text-right"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => removeTerminRow(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {terminSchedule.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Persentase</span>
                  <span className="font-medium">
                    {terminSchedule.reduce((sum, r) => sum + (r.persentase || 0), 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Nominal</span>
                  <span className="font-medium">{formatRupiah(terminSchedule.reduce((sum, r) => sum + (r.nominal || 0), 0))}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Item ({items.length})</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4 mr-1" />
              Tambah Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada item. Klik "Tambah Item" untuk menambahkan.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right w-20">Qty</TableHead>
                    <TableHead className="text-right w-28">Harga Satuan</TableHead>
                    <TableHead className="text-right w-24">Berat (gr)</TableHead>
                    <TableHead className="text-right w-28">Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={item.namaProduk}
                          onChange={(e) => updateItem(index, "namaProduk", e.target.value)}
                          placeholder="Nama produk"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.qty || ""}
                          onChange={(e) => updateItem(index, "qty", Number(e.target.value) || 0)}
                          className="h-9 text-right w-16"
                          min={1}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.hargaSatuan || ""}
                          onChange={(e) => updateItem(index, "hargaSatuan", Number(e.target.value) || 0)}
                          className="h-9 text-right"
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.beratGram || ""}
                          onChange={(e) => updateItem(index, "beratGram", Number(e.target.value) || 0)}
                          className="h-9 text-right w-20"
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(item.subtotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Diskon (%)</label>
              <Input
                type="number"
                value={diskonPersen || ""}
                onChange={(e) => setDiskonPersen(Number(e.target.value) || 0)}
                className="h-9"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Diskon (Rp)</label>
              <Input
                type="number"
                value={diskonNominal || ""}
                onChange={(e) => setDiskonNominal(Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pajak (Rp)</label>
              <Input
                type="number"
                value={pajak || ""}
                onChange={(e) => setPajak(Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ongkir (Rp)</label>
              <Input
                type="number"
                value={biayaOngkir || ""}
                onChange={(e) => setBiayaOngkir(Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Diskon</span>
              <span className="font-medium text-destructive">- {formatRupiah(diskonAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pajak</span>
              <span className="font-medium">+ {formatRupiah(pajak)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-medium">+ {formatRupiah(biayaOngkir)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-base font-semibold">Total</span>
              <span className="text-lg font-bold">{formatRupiah(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalQty} item · {totalBerat.toLocaleString("id-ID")} gr
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardHeader>
          <CardTitle>Catatan</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan (opsional)"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={saving || items.length === 0}>
          {saving ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Menyimpan...
            </span>
          ) : (
            <><Save className="size-4 mr-1.5" />{submitLabel}</>
          )}
        </Button>
      </div>
    </form>
  )
}

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
