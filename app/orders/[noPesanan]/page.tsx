/**
 * @module app/orders/[noPesanan]/page
 * Order Detail Page — displays order header info + items table for a single order.
 *
 * Architecture:
 *   Page (server) → getOrderDetailAction → OrderDetailTable (client)
 */

import { Suspense } from "react";
import { getOrderDetailAction } from "@/features/orders/actions";
import type { OrderItem, OrderHeader } from "@/features/orders/actions";
import type { IncomeRecord, AdjustmentRecord } from "@/features/orders/types/OrderItem";
import OrderDetailTable from "@/features/orders/components/OrderDetailTable";

/* ─── Loading Skeleton ─── */

function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
      ))}
      <div className="h-48 bg-muted animate-pulse rounded-xl" />
    </div>
  );
}

/* ─── Page ─── */

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ noPesanan: string }>;
}) {
  const { noPesanan } = await params;
  let result: { header: OrderHeader | null; items: OrderItem[]; income: IncomeRecord | null; adjustments: AdjustmentRecord[] } | null = null;
  let error: string | null = null;

  try {
    result = await getOrderDetailAction(noPesanan);
  } catch {
    error = "Gagal memuat data pesanan. Silakan coba lagi.";
  }

  if (error || !result) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<DetailSkeleton />}>
        <OrderDetailTable
          header={result.header}
          items={result.items}
          income={result.income}
          adjustments={result.adjustments}
          noPesanan={noPesanan}
        />
      </Suspense>
    </main>
  );
}
