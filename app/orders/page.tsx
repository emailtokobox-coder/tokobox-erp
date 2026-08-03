/**
 * @module app/orders/page
 * Order List Page — displays searchable, filterable, paginated order table.
 *
 * Architecture:
 *   Page (server) → getOrdersAction → OrderListTable (client)
 */

import { Suspense } from "react";
import { getOrdersAction } from "@/features/orders/actions";
import OrderListTable from "@/features/orders/components/OrderListTable";

/* ─── Force dynamic rendering — page uses server actions with Supabase ─── */
export const dynamic = "force-dynamic";

/* ─── Loading Skeleton ─── */

function OrdersSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      <div className="h-10 bg-muted animate-pulse rounded-lg" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; statusHpp?: string; statusIncome?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "all";

  const filter: Record<string, unknown> = { page, pageSize: 50 };
  if (search) filter["search"] = search;
  if (status && status !== "all") filter["statusOrderFinal"] = status;
  if (params.statusHpp && params.statusHpp !== "all") filter["statusHpp"] = params.statusHpp;
  if (params.statusIncome && params.statusIncome !== "all") filter["statusIncome"] = params.statusIncome;
  if (params.dateFrom) filter["dateFrom"] = params.dateFrom;
  if (params.dateTo) filter["dateTo"] = params.dateTo;

  const result = await getOrdersAction(filter);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<OrdersSkeleton />}>
        <OrderListTable
          initialData={result}
          initialSearch={search}
          initialStatus={status}
          initialStatusHpp={params.statusHpp}
          initialStatusIncome={params.statusIncome}
          initialDateFrom={params.dateFrom}
          initialDateTo={params.dateTo}
        />
      </Suspense>
    </main>
  );
}
