/**
 * @module features/inventory/services/StockSaldoService
 * Stock Saldo Service — computes stock balances from movements and syncs to stockSaldo table.
 *
 * Business Logic:
 * - MASUK → saldo += qty_base_unit
 * - KELUAR → saldo -= qty_base_unit
 * - Idempotent upsert: same saldo → skip, different → update, new → insert
 *
 * Usage:
 * - Auto: ImportOrchestrator calls syncStockSaldo() after stock movements insert
 * - Manual: Server action fetches movements, computes map, upserts
 *
 * Architecture:
 * movements[] → computeSaldoFromMovements() → Map<baseProduct, saldo> → syncStockSaldo()
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { StockMovement, StockMovementRow } from "../types";

/* ─── Result Types ─── */

export interface SaldoSyncResult {
  syncedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface MovementSummary {
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  lastMovementDate: string;
}

/* ─── Stock Saldo Service ─── */

/**
 * Convert a StockMovement to a StockMovementRow-compatible shape.
 * Filters out OPNAME/SALDO_AWAL types (not part of daily import flow).
 */
export function toMovementRow(m: StockMovement): StockMovementRow | null {
  if (m.tipe !== "MASUK" && m.tipe !== "KELUAR") return null
  return {
    baseProduct: m.baseProduct,
    tipe: m.tipe,
    tanggal: m.tanggal,
    noRef: m.noRef,
    qtyBaseUnit: m.qtyBaseUnit,
    source: m.source === "shopee" ? "shopee" : ("shopee" as const),
    supplier: m.supplier,
    keterangan: m.keterangan,
  }
}

export class StockSaldoService {
  /**
   * Compute saldo map from stock movements.
   * Loops all movements, aggregates by base_product.
   * MASUK → saldo += qty_base_unit
   * KELUAR → saldo -= qty_base_unit
   *
   * @param movements - Array of stock movement records
   * @returns Map<base_product, saldo>
   */
  static computeSaldoFromMovements(
    movements: StockMovementRow[],
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const m of movements) {
      const current = map.get(m.baseProduct) ?? 0;
      if (m.tipe === "MASUK") {
        map.set(m.baseProduct, current + m.qtyBaseUnit);
      } else if (m.tipe === "KELUAR") {
        map.set(m.baseProduct, current - m.qtyBaseUnit);
      }
      // OPNAME and SALDO_AWAL skipped (not part of daily import flow)
    }
    return map;
  }

  /**
   * Upsert saldo into stockSaldo table via Supabase client.
   * Idempotent behavior:
   * - Existing record with same saldo → skip
   * - Existing record with different saldo → update
   * - No existing record → insert
   *
   * @param client - Supabase client (from orchestrator or action)
   * @param saldoMap - Map<base_product, saldo> from computeSaldoFromMovements()
   * @returns { syncedCount, skippedCount, errors }
   */
  static async syncStockSaldo(
    client: SupabaseClient,
    saldoMap: Map<string, number>,
  ): Promise<SaldoSyncResult> {
    const result: SaldoSyncResult = {
      syncedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    const storeId = "default";

    for (const [baseProduct, newSaldo] of saldoMap) {
      try {
        // Check existing saldo for this product
        const { data: existing } = await client
          .from("stockSaldo")
          .select("id, saldo")
          .eq("base_product", baseProduct)
          .maybeSingle();

        if (existing) {
          const currentSaldo = existing.saldo ?? 0;
          if (currentSaldo === newSaldo) {
            // Idempotent skip — saldo unchanged
            result.skippedCount++;
            continue;
          }
          // Update saldo
          const { error } = await client
            .from("stockSaldo")
            .update({ saldo: newSaldo, last_updated: new Date().toISOString() })
            .eq("id", existing.id);

          if (error) {
            result.errors.push(
              `Gagal update saldo ${baseProduct}: ${error.message}`,
            );
            continue;
          }
          result.syncedCount++;
        } else {
          // Insert new record
          const { error } = await client
            .from("stockSaldo")
            .insert({
              store_id: storeId,
              base_product: baseProduct,
              saldo: newSaldo,
            });

          if (error) {
            result.errors.push(
              `Gagal insert saldo ${baseProduct}: ${error.message}`,
            );
            continue;
          }
          result.syncedCount++;
        }
      } catch (err) {
        result.errors.push(
          `Error processing ${baseProduct}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return result;
  }

  /**
   * Per-product movement summary.
   * Aggregates total_masuk, total_keluar, saldo_akhir, and last_movement_date
   * from stock movements for a specific base product.
   *
   * @param baseProduct - Base product SKU to summarize
   * @param movements - Full array of stock movements
   * @returns Movement summary for the product
   */
  static getMovementSummary(
    baseProduct: string,
    movements: StockMovementRow[],
  ): MovementSummary {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let lastDate = "";

    for (const m of movements) {
      if (m.baseProduct !== baseProduct) continue;
      if (m.tipe === "MASUK") {
        totalMasuk += m.qtyBaseUnit;
      } else if (m.tipe === "KELUAR") {
        totalKeluar += m.qtyBaseUnit;
      }
      if (m.tanggal && m.tanggal > lastDate) {
        lastDate = m.tanggal;
      }
    }

    return {
      totalMasuk,
      totalKeluar,
      saldoAkhir: totalMasuk - totalKeluar,
      lastMovementDate: lastDate,
    };
  }
}
