/**
 * @module app/manual-orders/page
 * Manual Orders List Page — server page that renders the ManualOrdersTable client component.
 *
 * Architecture:
 *   Page (server) → getManualOrdersAction → ManualOrdersTable (client)
 *
 * The server component fetches initial data, then delegates all interactive
 * filtering, search, and pagination to the client-side ManualOrdersTable.
 */

import { Suspense } from "react";
import { getManualOrdersAction } from "@/features/manual-orders/actions";
import { ManualOrdersTable } from "@/features/manual-orders/components";

/* ─── Loading Skeleton ─── */

function ManualOrdersSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      <div className="h-10 bg-muted animate-pulse rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function ManualOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tipe?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const tipe = params.tipe || "all";
  const status = params.status || "all";

  const filter: Record<string, unknown> = { page, pageSize: 20 };
  if (tipe && tipe !== "all") filter["tipe"] = tipe;
  if (status && status !== "all") filter["status"] = status;

  const initialData = await getManualOrdersAction(filter);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<ManualOrdersSkeleton />}>
        <ManualOrdersTable initialData={initialData} />
      </Suspense>
    </main>
  );
}
