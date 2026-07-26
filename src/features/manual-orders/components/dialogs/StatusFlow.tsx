"use client"

import { useState, Fragment } from "react";

/**
 * @module manual-orders/components/dialogs/StatusFlow
 * Status Flow Progression — visual stepper for manual order status flow.
 *
 * Shows the order's progress through the status pipeline and allows
 * advancing to the next valid status via a button.
 *
 * Per PRD 7.9 status flows:
 *   CASH:  Draft → Invoice_Terkirim → Terkirim → Lunas → Selesai
 *   DP:    Draft → Invoice_Terkirim → Menunggu_Pembayaran_DP → DP_Lunas
 *          → Pelunasan_Diminta → Pelunasan_Diterima → Terkirim → Lunas → Selesai
 *   TERMIN: Draft → Invoice_Terkirim → ACC_Termin → Kirim_Invoice_Tagihan
 *          → Produksi → Siap_Kirim → Terkirim → Lunas → Selesai
 */


import { ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  type ManualOrderStatus,
  getStatusFlow,
  getNextStatuses,
  getStatusLabel,
} from "@/features/manual-orders"
import type { ManualOrder } from "@/features/manual-orders"

/* ─── Props ─── */

interface StatusFlowProps {
  order: ManualOrder
  onStatusChange: (newStatus: ManualOrderStatus) => Promise<void>
}

/* ─── StatusFlow Component ─── */

export default function StatusFlow({ order, onStatusChange }: StatusFlowProps) {
  const [advancing, setAdvancing] = useState(false)
  const flow = getStatusFlow(order.tipePesanan)
  const currentIdx = flow.indexOf(order.statusOrder)
  const nextStatuses = getNextStatuses(order.statusOrder, order.tipePesanan)
  const isComplete = currentIdx >= flow.length - 1

  const handleAdvance = async () => {
    if (nextStatuses.length === 0) return
    setAdvancing(true)
    try {
      await onStatusChange(nextStatuses[0])
    } finally {
      setAdvancing(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 className="size-5" />
        <span className="text-sm font-medium">Pesanan Selesai</span>
        <Badge variant="default" className="ml-2">{getStatusLabel(order.statusOrder)}</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Stepper */}
      <div className="flex items-center gap-1 flex-wrap">
        {flow.map((status, idx) => {
          const isActive = idx === currentIdx
          const isPast = idx < currentIdx
          const isNext = idx === currentIdx + 1

          return (
            <Fragment key={status}>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isPast && "bg-success/15 text-success",
                    !isActive && !isPast && "bg-muted text-muted-foreground",
                    isNext && !isActive && "ring-2 ring-primary/30"
                  )}
                >
                  {isPast && <CheckCircle2 className="size-3 mr-1" />}
                  {getStatusLabel(status)}
                </span>
              </div>
              {idx < flow.length - 1 && (
                <ChevronRight className="size-3.5 text-muted-foreground mx-0.5" />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Advance button */}
      {nextStatuses.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAdvance}
            disabled={advancing}
          >
            {advancing ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memproses...
              </span>
            ) : (
              <>
                <ChevronRight className="size-3.5 mr-1" />
                Lanjut ke {getStatusLabel(nextStatuses[0])}
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Status saat ini: <Badge variant="secondary">{getStatusLabel(order.statusOrder)}</Badge>
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── cn helper (local, matching project pattern) ─── */

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
