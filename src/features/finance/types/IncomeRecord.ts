/**
 * @module finance/types/IncomeRecord
 * Income record type — matches Supabase `incomes` table schema.
 *
 * Per PRD 5.4:
 *   - store_id, no_pesanan, username_pembeli, metode_pembayaran
 *   - total_penghasilan (kolom AG)
 *   - All Shopee income columns
 */

export interface IncomeRecord {
  id: string
  storeId: string
  noPesanan: string
  usernamePembeli: string
  waktuPesananDibuat: string
  metodePembayaran: string
  tanggalDanaDilepaskan: string
  hargaAsliProduk: number
  totalDiskonProduk: number
  pengembalianDana: number
  diskonDariShopee: number
  voucherPenjual: number
  ongkirDibayarPembeli: number
  gratisOngkirShopee: number
  biayaKomisiAms: number
  biayaAdministrasi: number
  biayaLayanan: number
  biayaProsesPesanan: number
  totalPenghasilan: number
  importDate: string
}

/**
 * Filter for income listing queries.
 */
export interface IncomeFilter {
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}
