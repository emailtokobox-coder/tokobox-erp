/**
 * @module app/manual-orders/[id]/page
 * Manual Order Detail Page — server page that renders ManualOrderDetail client component.
 *
 * Architecture:
 *   Page (server) → getManualOrderDetailAction → ManualOrderDetail (client)
 */

import { Suspense } from "react";
import { getManualOrderDetailAction } from "@/features/manual-orders/actions";
import ManualOrderDetail from "@/features/manual-orders/components/dialogs/ManualOrderDetail";

/* ─── Loading Skeleton ─── */

function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function ManualOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getManualOrderDetailAction(id);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<DetailSkeleton />}>
        <ManualOrderDetail
          order={result.order}
          items={result.items}
          dpPayments={result.dpPayments}
          terminPayments={result.terminPayments}
          resi={result.resi}
          whatsappLogs={result.whatsappLogs}
          orderId={id}
        />
      </Suspense>
    </main>
  );
}
