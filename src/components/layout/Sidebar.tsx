"use client"

import { ComponentType } from "react";


import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Upload,
  Settings,
  Warehouse,
  Wallet,
  ClipboardList,
  Timer,
  TrendingUp,
  Building2,
  LogOut,
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";

interface SidebarItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pesanan", href: "/orders", icon: Package },
  { label: "Pesanan Manual", href: "/manual-orders", icon: ClipboardList },
  { label: "Unggah", href: "/upload", icon: Upload },
  { label: "Inventori", href: "/inventory", icon: Warehouse },
  { label: "Income", href: "/income", icon: Wallet },
  { label: "Profit", href: "/profit", icon: TrendingUp },
  { label: "Supplier", href: "/supplier", icon: Building2 },
  { label: "Status", href: "/status-tracker", icon: Timer },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar — navigation panel with user info footer.
 * Shows user email + avatar initials at bottom, plus sign out button.
 */
function Sidebar({ className, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { session, user, signOut } = useSession();

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "bg-muted/30 border-r flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* Header */}
      <div data-slot="sidebar-header" className="h-14 flex items-center px-4 border-b">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight">TokoBox ERP</span>
        )}
        {collapsed && (
          <span className="text-sm font-semibold">TB</span>
        )}
      </div>

      {/* Navigation */}
      <nav data-slot="sidebar-nav" className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              data-slot="sidebar-item"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info footer */}
      {!collapsed && session && (
        <div data-slot="sidebar-footer" className="border-t p-3 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-2">
            {/* Avatar initials */}
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user?.avatarInitials || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{session.email}</p>
              <p className="text-[10px] text-muted-foreground">Online</p>
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export { Sidebar, type SidebarItem };
