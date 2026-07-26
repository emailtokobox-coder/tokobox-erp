"use client"

import type { ReactNode } from "react";

/**
 * @module dashboard/components/QuickActions
 * Quick Actions — action buttons for fast navigation.
 *
 * Per PRD 7.1:
 *   - Import File, Lihat Pesanan, Lihat HPP Resolver
 */


import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Upload, ListOrdered, AlertTriangle } from "lucide-react"

function ActionLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

export default function QuickActions() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Aksi Cepat</h3>
      <div className="flex flex-wrap gap-2">
        <ActionLink href="/upload" icon={<Upload className="size-4" />} label="Import File" />
        <ActionLink href="/orders" icon={<ListOrdered className="size-4" />} label="Lihat Pesanan" />
        <ActionLink href="/hpp-resolver" icon={<AlertTriangle className="size-4" />} label="Lihat HPP Resolver" />
      </div>
    </Card>
  )
}
