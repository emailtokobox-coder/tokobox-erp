"use client"

import type { ReactNode } from "react";

/**
 * @module dashboard/components/KpiCard
 * KPI Card — displays a single KPI metric with icon, value, and optional trend.
 *
 * Per PRD 7.1:
 *   - Total Pesanan, Total Omzet, Total Profit, Belum Ada Income
 *   - Sub KPI: Selesai/Normal, Retur Sebagian, Retur Full, Batal
 */


import { Card } from "@/components/ui/card"
import type { KpiCard } from "../types"

// ─── Icon Map ───

const ICON_MAP: Record<string, ReactNode> = {
  "package": (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  "trending-up": (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  "wallet": (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z" />
    </svg>
  ),
  "clock": (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
}

// ─── Color Variants ───

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    iconBg: "bg-primary/20",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-800/40",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-800/40",
  },
  destructive: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-800/40",
  },
  neutral: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    iconBg: "bg-muted",
  },
}

// ─── Trend Icon ───

function TrendIcon({ trend }: { trend?: "up" | "down" | "neutral" }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6" />
        </svg>
        naik
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center text-xs text-red-600 dark:text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
        turun
      </span>
    )
  }
  return null
}

// ─── KpiCard Component ───

interface KpiCardProps {
  card: KpiCard
}

export default function KpiCard({ card }: KpiCardProps) {
  const colors = COLOR_MAP[card.color] ?? COLOR_MAP["neutral"]
  const icon = ICON_MAP[card.icon] ?? ICON_MAP["package"]

  return (
    <Card className={`p-5 ${colors.bg} border-0`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {card.label}
          </p>
          <p className={`text-2xl font-semibold tracking-tight ${colors.text}`}>
            {card.value}
          </p>
          {card.subValue && (
            <p className="text-xs text-muted-foreground">{card.subValue}</p>
          )}
          {card.trend && <TrendIcon trend={card.trend} />}
        </div>
        <div className={`rounded-lg p-2 ${colors.iconBg} ${colors.text}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
