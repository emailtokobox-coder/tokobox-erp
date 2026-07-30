/**
 * @module app/dashboard/layout
 * Dashboard layout — wraps dashboard routes with authentication check + AppShell.
 *
 * Architecture:
 * Server Component → checks session via getSessionAction → redirects if not authenticated
 * Wraps children with AppShell + Sidebar + PageHeader
 *
 * Note: SessionProvider is only in root layout.tsx — NOT duplicated here.
 */

import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
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
  );
}
