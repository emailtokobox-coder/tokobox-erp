/**
 * @module features/finance/actions/incomeSyncAction
 * Income Sync Server Action — triggered after income file import.
 *
 * Per PRD Section 3.10:
 * - Match all income that haven't been matched to orders
 * - Calculate estimated income for orders without income
 *
 * Triggered by: ImportOrchestrator after income insert completes
 *
 * Architecture:
 * ServerAction → IncomeSummaryService → DB update (via service/repository)
 */

import { createSupabaseClient } from "@/lib/supabase/client"
import { IncomeSummaryService } from "@/features/finance/services/IncomeSummaryService"
import type { OrderHeader, IncomeRecord } from "@/features/orders/types/OrderItem"

// ─── Result Type ───

export interface IncomeSyncResult {
  success: boolean
  matchedCount: number
  estimatedCount: number
  updatedOrders: Array<{
    noPesanan: string
    incomeAktual: number
    statusIncome: string
    statusProfit: string
  }>
  errors: string[]
}

// ─── Income Sync Action ───

/**
 * Sync all income records with orders.
 *
 * Process:
 * 1. Fetch all orders for the store (non-cancelled)
 * 2. Fetch all income records for the store
 * 3. Match income to orders using IncomeSummaryService
 * 4. Estimate income for unmatched orders
 * 5. Update order records in DB with income/profit data
 *
 * @param storeId - Store identifier
 * @returns IncomeSyncResult with counts and errors
 */
export async function incomeSyncAction(storeId: string): Promise<IncomeSyncResult> {
  const client = createSupabaseClient()
  const errors: string[] = []
  const updatedOrders: IncomeSyncResult["updatedOrders"] = []

  try {
    // 1. Fetch orders that need income matching
    const { data: headersData, error: headersError } = await client
      .from("orderHeaders")
      .select("*")
      .eq("store_id", storeId)
      .neq("status_pesanan", "Batal")
      .in("status_income", ["Belum Ada Income", "Belum Ada Income / Estimasi", "Belum Ada Income"])

    if (headersError) {
      return {
        success: false,
        matchedCount: 0,
        estimatedCount: 0,
        updatedOrders: [],
        errors: [`Gagal fetch orders: ${headersError.message}`],
      }
    }

    // Map DB rows to OrderHeader type
    const headers: OrderHeader[] = (headersData ?? []).map((row) => ({
      storeId: row.store_id ?? "",
      noPesanan: row.no_pesanan ?? "",
      statusPesanan: row.status_pesanan ?? "",
      waktuPesananDibuat: row.waktu_pesanan_dibuat ?? "",
      waktuPembayaran: row.waktu_pembayaran ?? "",
      metodePembayaran: row.metode_pembayaran ?? "",
      usernamePembeli: row.username_pembeli ?? "",
      ekspedisi: row.ekspedisi ?? "",
      kota: row.kota ?? "",
      totalQtyOrder: row.total_qty_order ?? 0,
      totalQtyReturn: row.total_qty_return ?? 0,
      totalQtyValid: row.total_qty_valid ?? 0,
      totalOmzetValid: row.total_omzet_valid ?? 0,
      totalOmzetRetur: row.total_omzet_retur ?? 0,
      totalHppValid: row.total_hpp_valid ?? 0,
      totalHppRetur: row.total_hpp_retur ?? 0,
      statusOrderFinal: row.status_order_final ?? "Selesai / Normal",
      incomeAktual: row.income_aktual,
      statusIncome: row.status_income ?? "Belum Ada Income",
      totalPenyesuaian: row.total_penyesuaian ?? 0,
      profitSebelumPenyesuaian: row.profit_sebelum_penyesuaian ?? 0,
      profitSetelahPenyesuaian: row.profit_setelah_penyesuaian ?? 0,
      statusProfit: row.status_profit ?? "Belum Ada Income",
      statusHpp: row.status_hpp ?? "HPP Kosong",
      itemCount: row.item_count ?? 0,
      importDate: row.import_date ?? "",
    }))

    // 2. Fetch income records for the store
    const { data: incomesData, error: incomesError } = await client
      .from("incomes")
      .select("*")
      .eq("store_id", storeId)

    if (incomesError) {
      return {
        success: false,
        matchedCount: 0,
        estimatedCount: 0,
        updatedOrders: [],
        errors: [`Gagal fetch incomes: ${incomesError.message}`],
      }
    }

    // Map DB rows to IncomeRecord type
    const incomes: IncomeRecord[] = (incomesData ?? []).map((row) => ({
      id: row.id,
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

    // 3. Match income to orders using service
    // Fetch marketplace rate from settings (default 25%)
    const ratePct = await getMarketplaceRate(client, storeId)
    const matchResult = IncomeSummaryService.matchIncomeToOrders(
      headers,
      incomes,
      ratePct,
    )

    // 4. Update orders in DB that changed
    for (const updatedHeader of matchResult.headers) {
      // Check if anything actually changed
      const originalHeader = headers.find((h) => h.noPesanan === updatedHeader.noPesanan)
      if (!originalHeader) continue

      // Check if status changed from "Belum Ada Income"
      if (
        originalHeader.statusIncome !== updatedHeader.statusIncome ||
        (originalHeader.incomeAktual ?? 0) !== (updatedHeader.incomeAktual ?? 0)
      ) {
        const { error: updateError } = await client
          .from("orderHeaders")
          .update({
            income_aktual: updatedHeader.incomeAktual,
            status_income: updatedHeader.statusIncome,
            profit_sebelum_penyesuaian: updatedHeader.profitSebelumPenyesuaian,
            profit_setelah_penyesuaian: updatedHeader.profitSetelahPenyesuaian,
            status_profit: updatedHeader.statusProfit,
            waktu_pembayaran: updatedHeader.waktuPembayaran,
            metode_pembayaran: updatedHeader.metodePembayaran,
            username_pembeli: updatedHeader.usernamePembeli,
            total_penyesuaian: updatedHeader.totalPenyesuaian,
          })
          .eq("no_pesanan", updatedHeader.noPesanan)
          .eq("store_id", storeId)

        if (updateError) {
          errors.push(`[${updatedHeader.noPesanan}] Gagal update: ${updateError.message}`)
          continue
        }

        updatedOrders.push({
          noPesanan: updatedHeader.noPesanan,
          incomeAktual: updatedHeader.incomeAktual ?? 0,
          statusIncome: updatedHeader.statusIncome,
          statusProfit: updatedHeader.statusProfit,
        })
      }
    }

    // Count matched vs estimated
    const matchedCount = updatedOrders.filter(
      (o) => o.statusIncome === "Sudah Cocok",
    ).length
    const estimatedCount = updatedOrders.filter(
      (o) => o.statusIncome === "Belum Ada Income / Estimasi",
    ).length

    return {
      success: errors.length === 0,
      matchedCount,
      estimatedCount,
      updatedOrders,
      errors,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      matchedCount: 0,
      estimatedCount: 0,
      updatedOrders: [],
      errors: [...errors, errorMessage],
    }
  }
}

// ─── Helper: Get Marketplace Rate from Settings ───

async function getMarketplaceRate(
  client: ReturnType<typeof createSupabaseClient>,
  storeId: string,
): Promise<number> {
  try {
    const { data, error } = await client
      .from("settings")
      .select("marketplace_rate_pct")
      .eq("store_id", storeId)
      .single()

    if (error || !data) {
      return 25 // Default 25%
    }

    return data.marketplace_rate_pct ?? 25
  } catch {
    return 25 // Default on error
  }
}
