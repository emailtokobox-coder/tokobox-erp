/**
 * @module app/upload/page
 * Upload page — import Excel files into the database.
 *
 * Architecture:
 *   Page → UploadForm → importFilesAction → ImportOrchestrator → Services → Repositories → DbTransaction → Supabase
 */

import { Suspense } from "react";
import UploadForm from "@/features/upload/components/UploadForm";

function UploadFormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
      <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
      ))}
      <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
    </div>
  );
}

export default function UploadPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <Suspense fallback={<UploadFormSkeleton />}>
        <UploadForm />
      </Suspense>
    </main>
  );
}
