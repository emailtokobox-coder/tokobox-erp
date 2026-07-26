"use client"

import type { ReactNode } from "react";


import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  className?: string;
}

function AppShell({ children, sidebar, header, className }: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn("flex min-h-screen bg-background", className)}
    >
      {sidebar}
      <div data-slot="app-shell-main" className="flex flex-1 flex-col">
        {header}
        <main data-slot="app-shell-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AppShell };
