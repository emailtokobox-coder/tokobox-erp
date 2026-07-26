/**
 * @module app/upload/history/page
 * Upload History Page — displays import history table.
 *
 * Architecture:
 *   Page (server) → getImportHistoryAction → UploadHistoryTable (client)
 */

import { Suspense } from "react";
import { getImportHistoryAction } from "@/features/upload/actions/getImportHistoryAction";
import UploadHistoryTable from "@/features/upload/components/UploadHistoryTable";

/* ─── Loading Skeleton ─── */

function HistorySkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      <div className="h-10 bg-muted animate-pulse rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function UploadHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const history = await getImportHistoryAction({ page, pageSize: 20, search });

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<HistorySkeleton />}>
        <UploadHistoryTable initialData={history} initialSearch={search} />
      </Suspense>
    </main>
  );
}
