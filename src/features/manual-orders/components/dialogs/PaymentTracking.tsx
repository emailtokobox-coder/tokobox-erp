"use client"

import { useState } from "react";

/**
 * @module manual-orders/components/dialogs/PaymentTracking
 * Payment Tracking — confirmation forms for DP and Termin payments.
 *
 * Allows users to:
 * - View payment schedule details
 * - Mark payments as Lunas or Ditolak
 * - Add confirmation proof (URL/text)
 * - Add notes for Termin payments
 *
 * Per PRD 7.9 + 5.16-5.17 (dpPayments + terminPayments tables).
 */


import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  updateDpPaymentStatusAction,
  updateTerminPaymentStatusAction,
  type DpPayment,
  type TerminPayment,
} from "@/features/manual-orders"
import { PAYMENT_METHODS } from "@/features/manual-orders/constants/manualOrderStatus"

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

/* ─── Props ─── */

interface PaymentTrackingProps {
  dpPayments: DpPayment[]
  terminPayments: TerminPayment[]
  tipePesanan: "MANUAL_CASH" | "MANUAL_DP" | "MANUAL_TERMIN"
  onUpdate?: () => void
}

/* ─── PaymentTracking Component ─── */

export default function PaymentTracking({
  dpPayments,
  terminPayments,
  tipePesanan,
  onUpdate,
}: PaymentTrackingProps) {
  // DP confirmation state
  const [dpConfirmId, setDpConfirmId] = useState<string | null>(null)
  const [dpBukti, setDpBukti] = useState("")
  const [dpSaving, setDpSaving] = useState(false)

  // Termin confirmation state
  const [tpConfirmId, setTpConfirmId] = useState<string | null>(null)
  const [tpBukti, setTpBukti] = useState("")
  const [tpCatatan, setTpCatatan] = useState("")
  const [tpSaving, setTpSaving] = useState(false)

  const handleDpConfirm = async (paymentId: string, status: DpPayment["status"]) => {
    setDpSaving(true)
    try {
      await updateDpPaymentStatusAction(paymentId, status, dpBukti || undefined)
      setDpConfirmId(null)
      setDpBukti("")
      onUpdate?.()
    } finally {
      setDpSaving(false)
    }
  }

  const handleTpConfirm = async (paymentId: string, status: TerminPayment["status"]) => {
    setTpSaving(true)
    try {
      await updateTerminPaymentStatusAction(paymentId, status, tpBukti || undefined, tpCatatan || undefined)
      setTpConfirmId(null)
      setTpBukti("")
      setTpCatatan("")
      onUpdate?.()
    } finally {
      setTpSaving(false)
    }
  }

  const showDp = tipePesanan === "MANUAL_DP"
  const showTp = tipePesanan === "MANUAL_TERMIN"

  return (
    <div className="space-y-4">
      {/* DP Payments */}
      {showDp && (
        <Card>
          <CardHeader>
            <CardTitle>DP Payments ({dpPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {dpPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada pembayaran DP</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Urutan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Persentase</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dpPayments.map((dp) => (
                      <TableRow key={dp.id || dp.urutan}>
                        <TableCell>{dp.urutan}</TableCell>
                        <TableCell>{formatDate(dp.tanggal)}</TableCell>
                        <TableCell className="text-right">{dp.persentase}%</TableCell>
                        <TableCell className="text-right">{formatRupiah(dp.nominal)}</TableCell>
                        <TableCell><span className="capitalize text-xs">{dp.metodePembayaran}</span></TableCell>
                        <TableCell>
                          <Badge variant={dp.status === "Lunas" ? "default" : dp.status === "Ditolak" ? "destructive" : "secondary"}>
                            {dp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dp.status === "Pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-success"
                                onClick={() => setDpConfirmId(dp.id || String(dp.urutan))}
                                title="Konfirmasi Lunas"
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive"
                                onClick={() => handleDpConfirm(dp.id!, "Ditolak")}
                                title="Tolak"
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* DP Confirmation Dialog */}
                {dpConfirmId && (
                  <div className="p-4 bg-muted/50 rounded-md space-y-3">
                    <p className="text-sm font-medium">Konfirmasi Pembayaran DP</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Metode Pembayaran</label>
                        <select
                          defaultValue="cash"
                          className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>{m === "cash" ? "Cash" : m === "transfer" ? "Transfer" : "QRIS"}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Bukti Pembayaran (URL)</label>
                        <Input
                          value={dpBukti}
                          onChange={(e) => setDpBukti(e.target.value)}
                          placeholder="https://..."
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => dpConfirmId && handleDpConfirm(dpConfirmId, "Lunas")}
                        disabled={dpSaving}
                      >
                        {dpSaving ? "Menyimpan..." : "Konfirmasi Lunas"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDpConfirmId(null); setDpBukti("") }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Termin Payments */}
      {showTp && (
        <Card>
          <CardHeader>
            <CardTitle>Jadwal Termin ({terminPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {terminPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada jadwal termin</p>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                  <span className="text-muted-foreground">Total Persentase</span>
                  <span className="font-medium">
                    {terminPayments.reduce((sum, r) => sum + (r.persentase || 0), 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                  <span className="text-muted-foreground">Total Nominal</span>
                  <span className="font-medium">{formatRupiah(terminPayments.reduce((sum, r) => sum + (r.nominal || 0), 0))}</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Persentase</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terminPayments.map((tp) => (
                      <TableRow key={tp.id || tp.urutan}>
                        <TableCell>{tp.urutan}</TableCell>
                        <TableCell>{formatDate(tp.tanggalJatuhTempo)}</TableCell>
                        <TableCell className="text-right">{tp.persentase}%</TableCell>
                        <TableCell className="text-right">{formatRupiah(tp.nominal)}</TableCell>
                        <TableCell>
                          <Badge variant={tp.status === "Lunas" ? "default" : tp.status === "Ditolak" ? "destructive" : "secondary"}>
                            {tp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tp.status === "Pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-success"
                                onClick={() => setTpConfirmId(tp.id || String(tp.urutan))}
                                title="Konfirmasi Lunas"
                              >
                                <CheckCircle2 className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive"
                                onClick={() => handleTpConfirm(tp.id!, "Ditolak")}
                                title="Tolak"
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Termin Confirmation Dialog */}
                {tpConfirmId && (
                  <div className="p-4 bg-muted/50 rounded-md space-y-3">
                    <p className="text-sm font-medium">Konfirmasi Pembayaran Termin</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Bukti Pembayaran (URL)</label>
                        <Input
                          value={tpBukti}
                          onChange={(e) => setTpBukti(e.target.value)}
                          placeholder="https://..."
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Catatan</label>
                        <Input
                          value={tpCatatan}
                          onChange={(e) => setTpCatatan(e.target.value)}
                          placeholder="Catatan tambahan..."
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => tpConfirmId && handleTpConfirm(tpConfirmId, "Lunas")}
                        disabled={tpSaving}
                      >
                        {tpSaving ? "Menyimpan..." : "Konfirmasi Lunas"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setTpConfirmId(null); setTpBukti(""); setTpCatatan("") }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Shadcn UI imports (local aliases for minimal component usage) ─── */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
