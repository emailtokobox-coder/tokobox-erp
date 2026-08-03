/**
 * @module app/manual-orders/[id]/edit/page
 * Manual Order Edit Page — server page that renders ManualOrderForm client component
 * with existing order data pre-filled.
 *
 * Architecture:
 *   Page (server) → getManualOrderDetailAction → ManualOrderForm (client) → updateManualOrderAction → Supabase
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getManualOrderDetailAction } from "@/features/manual-orders/actions";
import ManualOrderForm from "@/features/manual-orders/components/forms/ManualOrderForm";

/* ─── Force dynamic rendering — page uses server actions with Supabase ─── */
export const dynamic = "force-dynamic";

/* ─── Loading Skeleton ─── */

function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function EditManualOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params
  const result = await getManualOrderDetailAction(id)

  if (!result.order) {
    redirect("/manual-orders")
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<FormSkeleton />}>
        <ManualOrderForm
          initialData={result.order}
          submitLabel="Simpan Perubahan"
        />
      </Suspense>
    </main>
  );
}
