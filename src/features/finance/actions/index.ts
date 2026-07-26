/**
 * @module finance/actions
 * Server Actions — bridge between Finance UI and Supabase.
 *
 * Architecture:
 *   Page (server) → actions → Supabase tables (incomes, orderHeaders, monthly_profit view)
 *
 * Per PRD 8.4:
 *   - getIncomeAction: fetch income records with optional date filter
 *   - getProfitAction: fetch monthly profit report
 */

import { createSupabaseClient } from "@/lib/supabase/client"
import type { IncomeRecord, IncomeFilter, MonthlyProfit, ProfitBreakdown, ProfitFilter, ProfitReportResult } from "../types"

// ─── Income Actions ───

/**
 * Fetch income records with optional date range filter.
 * Ordered by tanggal_dana_dilepaskan descending.
 */
export async function getIncomeAction(
  filter?: IncomeFilter
): Promise<IncomeRecord[]> {
  const client = createSupabaseClient()

  let query = client
    .from("incomes")
    .select("*")
    .order("tanggal_dana_dilepaskan", { ascending: false })

  if (filter?.dateFrom) {
    query = query.gte("tanggal_dana_dilepaskan", filter.dateFrom)
  }
  if (filter?.dateTo) {
    query = query.lte("tanggal_dana_dilepaskan", filter.dateTo)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    query = query.or(`no_pesanan.ilike.%${q}%,username_pembeli.ilike.%${q}%`)
  }

  const { data } = await query

  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    storeId: row.store_id ?? "",
    noPesanan: row.no_pesanan ?? "",
    usernamePembeli: row.username_pembeli ?? "",
    waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
    metodePembayaran: row.metode_pembayaran ?? "",
    tanggalDanaDilepaskan: row.tanggal_dana_dilepaskan ?? "",
    hargaAsliProduk: row.harga_asli_produk ?? 0,
    totalDiskonProduk: row.total_diskon_produk ?? 0,
    pengembalianDana: row.pengembalian_dana ?? 0,
    diskonDariShopee: row.diskon_dari_shopee ?? 0,
    voucherPenjual: row.voucher_penjual ?? 0,
    ongkirDibayarPembeli: row.ongkir_dibayar_pembeli ?? 0,
    gratisOngkirShopee: row.gratis_ongkir_shopee ?? 0,
    biayaKomisiAms: row.biaya_komisi_ams ?? 0,
    biayaAdministrasi: row.biaya_administrasi ?? 0,
    biayaLayanan: row.biaya_layanan ?? 0,
    biayaProsesPesanan: row.biaya_proses_pesanan ?? 0,
    totalPenghasilan: row.total_penghasilan ?? 0,
    importDate: row.import_date ?? "",
  }))
}

// ─── Profit Actions ───

/**
 * Fetch profit report data from monthly_profit view.
 * Supports filtering by year, returns monthly breakdown + totals.
 */
export async function getProfitAction(
  filter?: ProfitFilter
): Promise<ProfitReportResult> {
  const client = createSupabaseClient()

  // Determine year range
  const currentYear = filter?.year ?? new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`
  const yearEnd = `${currentYear}-12-31`

  // Fetch monthly profit data from the view
  const { data: monthlyData } = await client
    .from("monthly_profit")
    .select("*")
    .gte("month", yearStart)
    .lte("month", yearEnd)
    .order("month", { ascending: true })

  const monthly: MonthlyProfit[] = (monthlyData ?? []).map((row) => ({
    id: row.id ?? "",
    storeId: row.store_id ?? "",
    month: row.month ?? "",
    totalOrders: row.total_orders ?? 0,
    totalOmzet: row.total_omzet ?? 0,
    totalHpp: row.total_hpp ?? 0,
    totalIncome: row.total_income ?? 0,
    totalAdjustment: row.total_adjustment ?? 0,
    totalProfit: row.total_profit ?? 0,
    profitMargin: row.profit_margin ?? 0,
  }))

  // Calculate overall breakdown from monthly data
  const breakdown: ProfitBreakdown = monthly.reduce(
    (acc, m) => {
      acc.totalOmzet += m.totalOmzet
      acc.totalHpp += m.totalHpp
      acc.totalIncome += m.totalIncome
      acc.totalAdjustment += m.totalAdjustment
      acc.profitSetelahPenyesuaian += m.totalProfit
      return acc
    },
    {
      totalOmzet: 0,
      totalHpp: 0,
      totalIncome: 0,
      totalAdjustment: 0,
      profitSebelumPenyesuaian: 0,
      profitSetelahPenyesuaian: 0,
      profitMargin: 0,
    }
  )

  // profit_sebelum_penyesuaian = totalIncome - totalHpp
  breakdown.profitSebelumPenyesuaian = breakdown.totalIncome - breakdown.totalHpp

  // Recalculate profit margin
  breakdown.profitMargin =
    breakdown.totalOmzet > 0
      ? (breakdown.profitSetelahPenyesuaian / breakdown.totalOmzet) * 100
      : 0

  return {
    monthly,
    breakdown,
    year: currentYear,
    monthCount: monthly.length,
  }
}
