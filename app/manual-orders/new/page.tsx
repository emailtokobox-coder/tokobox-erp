/**
 * @module app/manual-orders/new/page
 * Manual Order Create Page — server page that renders ManualOrderForm client component.
 *
 * Architecture:
 *   Page (server) → getNextManualOrderNumber → ManualOrderForm (client) → createManualOrderAction → Supabase
 */

import { Suspense } from "react";
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

export default async function NewManualOrderPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<FormSkeleton />}>
        <ManualOrderForm submitLabel="Buat Pesanan" />
      </Suspense>
    </main>
  );
}
