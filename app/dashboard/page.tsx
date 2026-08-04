/**
 * @module app/dashboard/page
 * Dashboard — KPI cards, quick actions, and overview.
 *
 * Architecture:
 *   Server Component → reads from Supabase via actions
 *   (currently showing placeholder data until Supabase is connected)
 */

import { Package, Upload, DollarSign, TrendingUp, AlertTriangle, ClipboardList, Warehouse, Wallet, Timer } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

/* ─── KPI Data (placeholder — replace with real data from Supabase) ─── */

const KPIS = [
  {
    label: "Total Pesanan",
    value: "0",
    sub: "Belum ada data",
    icon: Package,
    color: "text-blue-600",
  },
  {
    label: "Total Omzet",
    value: "Rp 0",
    sub: "Belum ada data",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    label: "Total Profit",
    value: "Rp 0",
    sub: "Belum ada data",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  {
    label: "Belum Ada Income",
    value: "0",
    sub: "Belum ada data",
    icon: AlertTriangle,
    color: "text-amber-600",
  },
];

/* ─── Quick Actions ─── */

const QUICK_ACTIONS = [
  {
    label: "Import File",
    description: "Upload Excel pesanan, income, adjustment, HPP",
    href: "/upload",
    icon: Upload,
  },
  {
    label: "Lihat Pesanan",
    description: "Browse dan kelola pesanan",
    href: "/orders",
    icon: Package,
  },
  {
    label: "Lihat Pesanan Manual",
    description: "Kelola pesanan manual Cash/DP/Termin",
    href: "/manual-orders",
    icon: ClipboardList,
  },
  {
    label: "Inventori",
    description: "HPP, stok, dan resolvers",
    href: "/inventori",
    icon: Warehouse,
  },
  {
    label: "Keuangan",
    description: "Income dan profit report",
    href: "/income",
    icon: Wallet,
  },
  {
    label: "Status Tracker",
    description: "Timeline dan kanban pesanan",
    href: "/status-tracker",
    icon: Timer,
  },
];

/* ─── Page ─── */

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                </div>
                <Icon className={`size-8 ${kpi.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{action.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Placeholder: Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-medium mb-2">Omzet 7 Hari</h3>
          <p className="text-sm text-muted-foreground">Chart akan muncul setelah ada data import.</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-2">Insights</h3>
          <p className="text-sm text-muted-foreground">Insights akan muncul setelah ada data.</p>
        </Card>
      </div>
    </div>
  );
}
