/**
 * @module app/dashboard/layout
 * Dashboard layout — wraps dashboard routes with SessionProvider and auth check.
 *
 * Architecture:
 *   Server Component → checks session, redirects if not authenticated
 *   Wraps children with SessionProvider for client-side session access
 */

import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { getSessionAction } from "@/lib/auth/actions";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication — if no session exists, redirect to login
  const session = await getSessionAction();
  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <PageHeader
            title="Dashboard"
            description="Ringkasan toko dan aktivitas terbaru"
          />
        }
      >
        {children}
      </AppShell>
    </SessionProvider>
  );
}
