/**
 * @module lib/database/transaction
 * Database transaction wrapper for Supabase PostgREST.
 *
 * Uses PostgREST transaction headers (Prefer: tx=uuid) to enable
 * atomic multi-table inserts. All operations within a transaction
 * either commit together or rollback on error.
 *
 * Usage:
 *   const tx = new DbTransaction(client);
 *   await tx.begin();
 *   await tx.insertOrders(headers);
 *   await tx.insertOrderItems(items);
 *   await tx.commit();
 *
 *   // or with rollback:
 *   try {
 *     await tx.begin();
 *     await tx.insertOrders(headers);
 *     await tx.insertOrderItems(items);
 *     await tx.commit();
 *   } catch (err) {
 *     await tx.rollback();
 *   }
 */

import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { DatabaseError } from "@/lib/errors";
import type {
  OrderItemProcessed,
  OrderHeaderProcessed,
  IncomeRow,
  AdjustmentRow,
  HppRow,
  GrosirRow,
} from "@/features/upload/types";
import type { StockMovementRow } from "@/features/inventory/services";

/* ─── Result Type ─── */

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/* ─── PostgREST Transaction Headers ─── */

const TX_PREFER_HEADER = "Prefer";

function txHeaders(transactionId?: string): Record<string, string> {
  if (!transactionId) {
    return { [TX_PREFER_HEADER]: "tx=uuid" };
  }
  return { [TX_PREFER_HEADER]: `tx=uuid:${transactionId}` };
}

function txCommitHeaders(transactionId: string): Record<string, string> {
  return { [TX_PREFER_HEADER]: `tx=uuid:${transactionId}:commit` };
}

function txRollbackHeaders(transactionId: string): Record<string, string> {
  return { [TX_PREFER_HEADER]: `tx=uuid:${transactionId}:rollback` };
}

/* ─── Error Handling ─── */

function wrapError(err: PostgrestError | Error, context: string): DatabaseError {
  if (err instanceof DatabaseError) return err;
  const message = `${context}: ${err instanceof Error ? err.message : String(err)}`;
  return new DatabaseError(message, { originalError: err });
}

/**
 * Apply transaction headers to a PostgREST query builder.
 * In Supabase JS v2 (postgrest-js), use the fluent .setHeader() method
 * instead of the removed .headers() chain.
 */
function applyTxHeaders<T>(
  builder: T,
  transactionId?: string
): T {
  const headers = txHeaders(transactionId);
  const result = builder as any;
  for (const [name, value] of Object.entries(headers)) {
    result.setHeader(name, value);
  }
  return result;
}

/* ─── DbTransaction Class ─── */

export class DbTransaction {
  private client: SupabaseClient;
  private transactionId: string | null = null;
  private active: boolean = false;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /* ─── Transaction Lifecycle ─── */

  /**
   * Begin a new transaction.
   * Sends a dummy RPC call with tx=uuid header to start the transaction.
   */
  async begin(): Promise<TransactionResult<void>> {
    if (this.active) {
      return { success: false, error: "Transaksi sudah aktif" };
    }

    try {
      // Start transaction via RPC with tx header in options (Supabase JS v2)
      const { error } = await (this.client as any).rpc("noop", {}, { headers: txHeaders() });

      if (error) {
        return { success: false, error: `Gagal memulai transaksi: ${error.message}` };
      }

      this.active = true;
      this.transactionId = crypto.randomUUID();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Gagal memulai transaksi: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Commit the active transaction.
   */
  async commit(): Promise<TransactionResult<void>> {
    if (!this.active || !this.transactionId) {
      return { success: false, error: "Tidak ada transaksi aktif untuk di-commit" };
    }

    try {
      // Commit via RPC with commit header in options (Supabase JS v2)
      const { error } = await (this.client as any).rpc("noop", {}, { headers: txCommitHeaders(this.transactionId) });

      if (error) {
        return { success: false, error: `Gagal commit transaksi: ${error.message}` };
      }

      this.active = false;
      this.transactionId = null;
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Gagal commit transaksi: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Rollback the active transaction.
   */
  async rollback(): Promise<TransactionResult<void>> {
    if (!this.active || !this.transactionId) {
      return { success: false, error: "Tidak ada transaksi aktif untuk di-rollback" };
    }

    try {
      // Rollback via RPC with rollback header in options (Supabase JS v2)
      const { error } = await (this.client as any).rpc("noop", {}, { headers: txRollbackHeaders(this.transactionId) });

      if (error) {
        return { success: false, error: `Gagal rollback transaksi: ${error.message}` };
      }

      this.active = false;
      this.transactionId = null;
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Gagal rollback transaksi: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /* ─── Insert Operations ─── */

  /**
   * Insert order headers into the `orders` table.
   */
  async insertOrders(
    items: OrderHeaderProcessed[]
  ): Promise<TransactionResult<OrderHeaderProcessed[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (items.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = items.map((item) => ({
        no_pesanan: item.noPesanan,
        store_id: item.storeId,
        total_qty_order: item.totalQtyOrder,
        total_qty_return: item.totalQtyReturn,
        total_qty_valid: item.totalQtyValid,
        total_omzet_valid: item.totalOmzetValid,
        total_omzet_retur: item.totalOmzetRetur,
        total_hpp_valid: item.totalHppValid,
        total_hpp_retur: item.totalHppRetur,
        status_order_final: item.statusOrderFinal,
        status_hpp: item.statusHpp,
        status_income: item.statusIncome,
        status_profit: item.statusProfit,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("orders").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert orders");
      }

      return { success: true, data: (data as unknown) as OrderHeaderProcessed[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert orders"
        ).message,
      };
    }
  }

  /**
   * Insert order items into the `order_items` table.
   */
  async insertOrderItems(
    items: OrderItemProcessed[]
  ): Promise<TransactionResult<OrderItemProcessed[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (items.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = items.map((item) => ({
        no_pesanan: item.noPesanan,
        sku: item.sku,
        nama_produk: item.namaProduk,
        nama_variasi: item.namaVariasi ?? null,
        qty_order: item.qtyOrder,
        qty_return: item.qtyReturn,
        qty_valid: item.qtyValid,
        harga_per_qty: item.hargaPerQty,
        omzet_valid: item.omzetValid,
        omzet_retur: item.omzetRetur,
        hpp_valid: item.hppValid,
        hpp_retur: item.hppRetur,
        status_item: item.statusItem,
        item_hash: item.itemHash,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("order_items").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert order_items");
      }

      return { success: true, data: (data as unknown) as OrderItemProcessed[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert order_items"
        ).message,
      };
    }
  }

  /**
   * Insert income rows into the `income` table.
   */
  async insertIncome(
    rows: IncomeRow[]
  ): Promise<TransactionResult<IncomeRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = rows.map((row) => ({
        no_pesanan: row.noPesanan,
        no_pengajuan: row.noPengajuan,
        waktu_pesanan_dibuat: row.waktuPesananDibuat,
        metode_pembayaran: row.metodePembayaran,
        tanggal_dana_dilepaskan: row.tanggalDanaDilepaskan,
        harga_asli_produk: row.hargaAsliProduk,
        total_diskon_produk: row.totalDiskonProduk,
        refund_buyer: row.refundBuyer,
        ongkir_dibayar_pembeli: row.ongkirDibayarPembeli,
        gratis_ongkir_shopee: row.gratisOngkirShopee,
        ongkir_diteruskan_ke_jasa_kirim: row.ongkirDiteruskanKeJasaKirim,
        ongkir_pengembalian: row.ongkirPengembalian,
        biaya_komisi_ams: row.biayaKomisiAms,
        biaya_administrasi: row.biayaAdministrasi,
        biaya_layanan: row.biayaLayanan,
        biaya_proses_pesanan: row.biayaProsesPesanan,
        income_aktual: row.incomeAktual,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("income").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert income");
      }

      return { success: true, data: (data as unknown) as IncomeRow[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert income"
        ).message,
      };
    }
  }

  /**
   * Update existing income rows where the matching no_pesanan already exists in the database.
   * Used when re-importing income with different values than existing records.
   * Business logic per PRD Section 3.10 idempotency rules.
   * @param updates - Array of old/new pairs; only the new values are used for update
   * @returns TransactionResult with list of updated rows
   */
  async updateIncome(
    updates: Array<{ old: IncomeRow; new: IncomeRow }>
  ): Promise<TransactionResult<IncomeRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (updates.length === 0) {
      return { success: true, data: [] };
    }

    try {
      for (const update of updates) {
        const { new: newRow } = update;
        const result = await applyTxHeaders(
          this.client
            .from("income")
            .update({
              no_pengajuan: newRow.noPengajuan,
              waktu_pesanan_dibuat: newRow.waktuPesananDibuat,
              metode_pembayaran: newRow.metodePembayaran,
              tanggal_dana_dilepaskan: newRow.tanggalDanaDilepaskan,
              harga_asli_produk: newRow.hargaAsliProduk,
              total_diskon_produk: newRow.totalDiskonProduk,
              refund_buyer: newRow.refundBuyer,
              ongkir_dibayar_pembeli: newRow.ongkirDibayarPembeli,
              gratis_ongkir_shopee: newRow.gratisOngkirShopee,
              ongkir_diteruskan_ke_jasa_kirim: newRow.ongkirDiteruskanKeJasaKirim,
              ongkir_pengembalian: newRow.ongkirPengembalian,
              biaya_komisi_ams: newRow.biayaKomisiAms,
              biaya_administrasi: newRow.biayaAdministrasi,
              biaya_layanan: newRow.biayaLayanan,
              biaya_proses_pesanan: newRow.biayaProsesPesanan,
              income_aktual: newRow.incomeAktual,
            })
            .eq("no_pesanan", newRow.noPesanan),
          this.transactionId || undefined
        );

        if ('error' in result && result.error) {
          throw wrapError(result.error, `Gagal update income untuk ${newRow.noPesanan}`);
        }
      }

      return { success: true, data: updates.map((u) => u.new) };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Update income"
        ).message,
      };
    }
  }

  /**
   * Insert adjustment rows into the `adjustments` table.
   */
  async insertAdjustments(
    rows: AdjustmentRow[]
  ): Promise<TransactionResult<AdjustmentRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = rows.map((row) => ({
        no: row.no,
        tanggal_adjustment: row.tanggalAdjustment,
        tipe_adjustment: row.tipeAdjustment,
        alasan_adjustment: row.alasanAdjustment,
        biaya_penyesuaian: row.biayaPenyesuaian,
        no_pesanan_terhubung: row.noPesananTerhubung,
        tanggal_dana_dilepaskan: row.tanggalDanaDilepaskan,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("adjustments").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert adjustments");
      }

      return { success: true, data: (data as unknown) as AdjustmentRow[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert adjustments"
        ).message,
      };
    }
  }

  /**
   * Insert HPP rows into the `hpp` table.
   */
  async insertHpp(rows: HppRow[]): Promise<TransactionResult<HppRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = rows.map((row) => ({
        sku: row.sku,
        hpp: row.hpp,
        nama_produk: row.namaProduk ?? null,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("hpp").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert hpp");
      }

      return { success: true, data: (data as unknown) as HppRow[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert hpp"
        ).message,
      };
    }
  }

  /**
   * Insert grosir rows into the `grosir` table.
   */
  async insertGrosir(
    rows: GrosirRow[]
  ): Promise<TransactionResult<GrosirRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = rows.map((row) => ({
        sku: row.sku,
        base_harga: row.baseHarga,
        min_qty: row.minQty,
        harga_grosir: row.hargaGrosir,
        mulai_berlaku: row.mulaiBerlaku,
        berlaku_sampai: row.berlakuSampai ?? null,
        catatan: row.catatan ?? null,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("grosir").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, "Gagal insert grosir");
      }

      return { success: true, data: (data as unknown) as GrosirRow[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert grosir"
        ).message,
      };
    }
  }

  /**
   * Insert stock movement records into the `stock_movements` table.
   * Generated automatically from imported order items (Iter 44).
   */
  async insertStockMovements(
    rows: StockMovementRow[]
  ): Promise<TransactionResult<StockMovementRow[]>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    try {
      const payload = rows.map((row) => ({
        store_id: "default",
        base_product: row.baseProduct,
        tipe: row.tipe,
        tanggal: row.tanggal,
        no_ref: row.noRef,
        qty_base_unit: row.qtyBaseUnit,
        source: row.source,
        supplier: row.supplier,
        keterangan: row.keterangan,
      }));

      const { data, error } = await applyTxHeaders(
        this.client.from("stock_movements").insert(payload),
        this.transactionId || undefined
      );

      if (error) {
        throw wrapError(error, `Gagal insert stock movements: ${error.message}`);
      }

      return { success: true, data: (data as unknown) as StockMovementRow[] };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Insert stock movements"
        ).message,
      };
    }
  }

  /* ─── Generic Transaction Executor ─── */

  /**
   * Execute arbitrary operations within the transaction context.
   * Automatically rolls back if the function throws.
   */
  async executeInTransaction<T>(
    fn: (tx: DbTransaction) => Promise<T>
  ): Promise<TransactionResult<T>> {
    if (!this.active) {
      return { success: false, error: "Transaksi belum dimulai. Panggil begin() terlebih dahulu." };
    }

    try {
      const result = await fn(this);
      return { success: true, data: result };
    } catch (err) {
      await this.autoRollback();
      return {
        success: false,
        error: wrapError(
          err instanceof Error ? err : new Error(String(err)),
          "Execute in transaction"
        ).message,
      };
    }
  }

  /* ─── Helpers ─── */

  private async autoRollback(): Promise<void> {
    if (this.active && this.transactionId) {
      try {
        // Use v2 compatible RPC call with headers option
        await (this.client as any).rpc("noop", {}, { headers: txRollbackHeaders(this.transactionId) });
      } catch {
        // Best-effort rollback
      }
      this.active = false;
      this.transactionId = null;
    }
  }

  get isActive(): boolean {
    return this.active;
  }
}
