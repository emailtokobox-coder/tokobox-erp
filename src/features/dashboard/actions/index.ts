/**
 * @module dashboard/actions
 * Server Actions — bridge between Dashboard UI and OrderRepository.
 *
 * Architecture:
 *   Page (server) → getDashboardSummaryAction → DashboardData
 */

"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import type { DashboardData, DailyTrend, InsightItem, FinanceRealTime } from "../types";
import { buildSummary } from "@/features/orders/domain/OrderCalculator"

// ─── Helper: format date range for last 7 days ───

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ─── Helper: build daily trends from headers ───

function buildDailyTrends(headers: Array<{
  waktuPesananDibuat: string
  totalOmzetValid: number
  profitSetelahPenyesuaian: number
}>): DailyTrend[] {
  const dayMap = new Map<string, { omzet: number; profit: number; count: number }>()

  for (const h of headers) {
    const date = h.waktuPesananDibuat.slice(0, 10)
    const existing = dayMap.get(date) ?? { omzet: 0, profit: 0, count: 0 }
    existing.omzet += h.totalOmzetValid
    existing.profit += h.profitSetelahPenyesuaian
    existing.count += 1
    dayMap.set(date, existing)
  }

  const last7 = getLast7Days()
  return last7.map((date) => {
    const entry = dayMap.get(date) ?? { omzet: 0, profit: 0, count: 0 }
    return { date, omzet: entry.omzet, profit: entry.profit, orderCount: entry.count }
  })
}

// ─── Helper: build insights from headers + items ───

function buildInsights(
  headers: Array<{
    usernamePembeli: string
    ekspedisi: string
    kota: string
    noPesanan: string
    waktuPesananDibuat: string
  }>,
  items: Array<{
    namaProduk: string
    sku: string
    qtyValid: number
  }>
): {
  jamTerbanyak: InsightItem | null
  ekspedisiTerpopuler: InsightItem | null
  kotaTerbanyak: InsightItem | null
  produkTerlaris: InsightItem | null
  pembeliTerbanyak: InsightItem | null
} {
  // Jam terbanyak
  const jamMap = new Map<string, number>()
  for (const h of headers) {
    const time = h.waktuPesananDibuat.slice(11, 13) || "00"
    const jam = `${time}:00`
    jamMap.set(jam, (jamMap.get(jam) ?? 0) + 1)
  }
  const jamSorted = [...jamMap.entries()].sort((a, b) => b[1] - a[1])
  const jamTerbanyak = jamSorted.length > 0
    ? { label: "Jam Terbanyak", value: jamSorted[0][0], subValue: `${jamSorted[0][1]} pesanan` }
    : null

  // Ekspedisi terpopuler
  const ekspedisiMap = new Map<string, number>()
  for (const h of headers) {
    const eks = h.ekspedisi || "Tidak diketahui"
    ekspedisiMap.set(eks, (ekspedisiMap.get(eks) ?? 0) + 1)
  }
  const ekspedisiSorted = [...ekspedisiMap.entries()].sort((a, b) => b[1] - a[1])
  const ekspedisiTerpopuler = ekspedisiSorted.length > 0
    ? { label: "Ekspedisi Terpopuler", value: ekspedisiSorted[0][0], subValue: `${ekspedisiSorted[0][1]} pesanan` }
    : null

  // Kota terbanyak
  const kotaMap = new Map<string, number>()
  for (const h of headers) {
    const kota = h.kota || "Tidak diketahui"
    kotaMap.set(kota, (kotaMap.get(kota) ?? 0) + 1)
  }
  const kotaSorted = [...kotaMap.entries()].sort((a, b) => b[1] - a[1])
  const kotaTerbanyak = kotaSorted.length > 0
    ? { label: "Kota Terbanyak", value: kotaSorted[0][0], subValue: `${kotaSorted[0][1]} pesanan` }
    : null

  // Produk terlaris (by qty valid)
  const produkMap = new Map<string, number>()
  for (const item of items) {
    if (item.qtyValid > 0) {
      produkMap.set(item.namaProduk, (produkMap.get(item.namaProduk) ?? 0) + item.qtyValid)
    }
  }
  const produkSorted = [...produkMap.entries()].sort((a, b) => b[1] - a[1])
  const produkTerlaris = produkSorted.length > 0
    ? { label: "Produk Terlaris", value: produkSorted[0][0], subValue: `${produkSorted[0][1]} unit terjual` }
    : null

  // Pembeli terbanyak
  const pembeliMap = new Map<string, number>()
  for (const h of headers) {
    const nama = h.usernamePembeli || "Anonymous"
    pembeliMap.set(nama, (pembeliMap.get(nama) ?? 0) + 1)
  }
  const pembeliSorted = [...pembeliMap.entries()].sort((a, b) => b[1] - a[1])
  const pembeliTerbanyak = pembeliSorted.length > 0
    ? { label: "Pembeli Terbanyak", value: pembeliSorted[0][0], subValue: `${pembeliSorted[0][1]} pesanan` }
    : null

  return { jamTerbanyak, ekspedisiTerpopuler, kotaTerbanyak, produkTerlaris, pembeliTerbanyak }
}

// ─── Server Action: getDashboardSummaryAction ───

/**
 * Fetch dashboard summary data.
 * Aggregates order headers + items for KPI cards, trends, and insights.
 */
export async function getDashboardSummaryAction(): Promise<DashboardData> {
  const client = createSupabaseClient();

  // Fetch all order headers
  const { data: headersData } = await client
    .from("orderHeaders")
    .select("*")
    .order("waktu_pesanan_dibuat", { ascending: false })

  // Fetch all order items
  const { data: itemsData } = await client
    .from("orderItems")
    .select("*")

  const headers = (headersData ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    noPesanan: row.no_pesanan ?? "",
    statusPesanan: row.status_pesanan ?? "",
    waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
    waktuPembayaran: row.waktu_pembayaran ?? "",
    metodePembayaran: row.metode_pembayaran ?? "",
    usernamePembeli: row.username_pembeli ?? "",
    ekspedisi: row.ekspedisi ?? undefined,
    kota: row.kota ?? undefined,
    totalQtyOrder: row.total_qty_order ?? 0,
    totalQtyReturn: row.total_qty_return ?? 0,
    totalQtyValid: row.total_qty_valid ?? 0,
    totalOmzetValid: row.total_omzet_valid ?? 0,
    totalOmzetRetur: row.total_omzet_retur ?? 0,
    totalHppValid: row.total_hpp_valid ?? 0,
    totalHppRetur: row.total_hpp_retur ?? 0,
    statusOrderFinal: row.status_order_final ?? "Selesai / Normal",
    incomeAktual: row.income_aktual ?? null,
    statusIncome: row.status_income ?? "Belum Ada Income",
    totalPenyesuaian: row.total_penyesuaian ?? 0,
    profitSebelumPenyesuaian: row.profit_sebelum_penyesuaian ?? 0,
    profitSetelahPenyesuaian: row.profit_setelah_penyesuaian ?? 0,
    statusProfit: row.status_profit ?? "Belum Ada Income",
    statusHpp: row.status_hpp ?? "HPP Kosong",
    itemCount: row.item_count ?? 0,
    importDate: row.import_date ?? "",
  }))

  const items = (itemsData ?? []).map((row) => ({
    id: row.id,
    storeId: row.store_id ?? "",
    noPesanan: row.no_pesanan ?? "",
    statusPesanan: row.status_pesanan ?? "",
    waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
    ekspedisi: row.ekspedisi ?? undefined,
    kota: row.kota ?? undefined,
    sku: row.sku ?? "",
    skuNormalized: row.sku_normalized ?? "",
    namaProduk: row.nama_produk ?? "",
    namaVariasi: row.nama_variasi ?? "",
    hargaAwal: row.harga_awal ?? 0,
    hargaSetelahDiskon: row.harga_setelah_diskon ?? 0,
    qtyOrder: row.qty_order ?? 0,
    qtyReturn: row.qty_return ?? 0,
    qtyValid: row.qty_valid ?? 0,
    nilaiItemTotal: row.nilai_item_total ?? 0,
    hargaPerQty: row.harga_per_qty ?? 0,
    omzetValid: row.omzet_valid ?? 0,
    omzetRetur: row.omzet_retur ?? 0,
    hppPerSku: row.hpp_per_sku ?? null,
    hppValid: row.hpp_valid ?? 0,
    hppRetur: row.hpp_retur ?? 0,
    statusItem: row.status_item ?? "NORMAL",
    itemHash: row.item_hash ?? "",
    importDate: row.import_date ?? "",
  }))

  // Build summary
  const summary = buildSummary(headers)

  // Build daily trends
  const trends = buildDailyTrends(headers)

  // Build insights
  const insights = buildInsights(headers, items)

  // Finance real-time
  const marketplaceRatePct = 25 // default, will come from settings
  const estimasiFeeMarketplace = summary.totalOmzet * (marketplaceRatePct / 100)
  const estimasiIncome = summary.totalOmzet - estimasiFeeMarketplace
  const finance: FinanceRealTime = {
    omzetValid: summary.totalOmzet,
    estimasiFeeMarketplace,
    estimasiIncome,
    incomeAktual: summary.totalIncome,
    hppValid: summary.totalHpp,
    profitAkhir: summary.totalProfit,
    marginPct: summary.profitMargin,
    marketplaceRatePct,
  }

  // Last import
  const { data: lastImportData } = await client
    .from("importLogs")
    .select("imported_at")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastImport = lastImportData?.imported_at
    ? new Date(lastImportData.imported_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return {
    summary,
    trends,
    insights,
    finance,
    lastImport,
  }
}
