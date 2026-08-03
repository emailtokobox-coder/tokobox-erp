/**
 * @module features/upload/actions/importFilesAction
 * Server Action — triggers the full import pipeline.
 *
 * Accepts FormData from the UI, runs ImportOrchestrator,
 * and returns a summary result.
 *
 * Usage in components:
 *   const result = await importFilesAction(formData);
 */

"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ImportOrchestrator } from "../services/ImportOrchestrator";
import type { ImportPayload, OrchestratorResult } from "../services/ImportOrchestrator";
import type { IncomeRow } from "../types";
import { profitRecalculateAction } from "@/features/finance/actions/profitRecalculateAction";
import { incomeSyncAction } from "@/features/finance/actions/incomeSyncAction";

/* ─── Configuration ─── */
// Max file size: 50MB (default, can be adjusted via env if needed)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 megabytes

/* ─── Helper: ArrayBuffer from File ─── */

function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/* ─── Helper: Validate file size before processing ─── */

function validateFileSize(file: File, fieldName: string): { error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { error: `${fieldName} Terlalu besar. Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }
  return {};
}

/* ─── Helper: Fetch existing income for idempotency check (PRD 3.10) ─── */

async function fetchExistingIncome(
  client: SupabaseClient,
): Promise<Map<string, IncomeRow>> {
  const { data } = await client
    .from("incomes")
    .select("no_pesanan, income_aktual, tanggal_dana_dilepaskan");
  if (!data || data.length === 0) return new Map();

  return new Map<string, IncomeRow>(
    (data as Array<{ no_pesanan: string; income_aktual: number; tanggal_dana_dilepaskan: string | null }>).map((r) => [
      String(r["no_pesanan"]),
      {
        noPesanan: String(r["no_pesanan"]),
        noPengajuan: "",
        waktuPesananDibuat: "",
        metodePembayaran: "",
        tanggalDanaDilepaskan: String(r["tanggal_dana_dilepaskan"] ?? ""),
        hargaAsliProduk: 0,
        totalDiskonProduk: 0,
        refundBuyer: 0,
        ongkirDibayarPembeli: 0,
        gratisOngkirShopee: 0,
        ongkirDiteruskanKeJasaKirim: 0,
        ongkirPengembalian: 0,
        biayaKomisiAms: 0,
        biayaAdministrasi: 0,
        biayaLayanan: 0,
        biayaProsesPesanan: 0,
        incomeAktual: r["income_aktual"] ?? 0,
      } as IncomeRow,
    ]),
  );
}

/* ─── Server Action ─── */

/**
 * Import multiple Excel files into the database.
 *
 * @param formData - FormData containing optional files: orderFile, incomeFile, adjustmentFile, hppFile, grosirFile
 * @returns OrchestratorResult with parse results and transaction status
 */
export async function importFilesAction(
  formData: FormData,
): Promise<OrchestratorResult> {
  /* 1. Create Supabase client */
  const client = await createServerClient();
  console.log('[DEBUG] importFilesAction: Supabase client created');
console.log('[DEBUG] importFilesAction: Supabase client created');

  /* 2. Extract files from FormData */
  const orderFile = formData.get("orderFile") as File | null;
  const incomeFile = formData.get("incomeFile") as File | null;
  const adjustmentFile = formData.get("adjustmentFile") as File | null;
  const hppFile = formData.get("hppFile") as File | null;
  const grosirFile = formData.get("grosirFile") as File | null;

  /* 3. Collect validation errors BEFORE any processing */
  const validationErrors: string[] = [];

  if (orderFile instanceof File) {
    const sizeCheck = validateFileSize(orderFile, "Order All");
    if (sizeCheck.error) validationErrors.push(sizeCheck.error);
  }
  if (incomeFile instanceof File) {
    const sizeCheck = validateFileSize(incomeFile, "Income");
    if (sizeCheck.error) validationErrors.push(sizeCheck.error);
  }
  if (adjustmentFile instanceof File) {
    const sizeCheck = validateFileSize(adjustmentFile, "Adjustment");
    if (sizeCheck.error) validationErrors.push(sizeCheck.error);
  }
  if (hppFile instanceof File) {
    const sizeCheck = validateFileSize(hppFile, "HPP");
    if (sizeCheck.error) validationErrors.push(sizeCheck.error);
  }
  if (grosirFile instanceof File) {
    const sizeCheck = validateFileSize(grosirFile, "Grosir");
    if (sizeCheck.error) validationErrors.push(sizeCheck.error);
  }

  /* If any validation error, return early without reading buffers */
  if (validationErrors.length > 0) {
    return {
      success: false,
      orders: {
        success: false,
        status: "error",
        data: [],
        errors: validationErrors,
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      income: {
        success: false,
        status: "error",
        data: [],
        toUpdate: [],
        errors: validationErrors,
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      adjustments: {
        success: false,
        status: "error",
        data: [],
        errors: validationErrors,
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      hpp: {
        success: false,
        status: "error",
        data: [],
        errors: validationErrors,
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
        hppMap: new Map(),
      },
      grosir: {
        success: false,
        status: "error",
        data: [],
        errors: validationErrors,
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
        grosirMap: new Map(),
      },
      stockMovements: [],
      saldoSyncResult: null,
      incomeImported: false,
      adjustmentsImported: false,
      hppImported: false,
      transactionCommitted: false,
      errors: validationErrors,
    };
  }

  /* 4. Build payload from FormData (only after validation passes) */
  const payload: ImportPayload = {};

  if (orderFile instanceof File) {
    payload.orderBuffer = await fileToBuffer(orderFile);
  }

  const needsIncomeFetch = incomeFile instanceof File;
  if (needsIncomeFetch) {
    payload.incomeBuffer = await fileToBuffer(incomeFile);
  }

  if (adjustmentFile instanceof File) {
    payload.adjustmentBuffer = await fileToBuffer(adjustmentFile);
  }

  if (hppFile instanceof File) {
    payload.hppBuffer = await fileToBuffer(hppFile);
  }

  if (grosirFile instanceof File) {
    payload.grosirBuffer = await fileToBuffer(grosirFile);
  }

  /* 5. Check if any files were provided */
  if (
    !payload.orderBuffer &&
    !payload.incomeBuffer &&
    !payload.adjustmentBuffer &&
    !payload.hppBuffer &&
    !payload.grosirBuffer
  ) {
    return {
      success: false,
      orders: {
        success: false,
        status: "error",
        data: [],
        errors: ["Tidak ada file yang diupload"],
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      income: {
        success: false,
        status: "error",
        data: [],
        toUpdate: [],
        errors: [],
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      adjustments: {
        success: false,
        status: "error",
        data: [],
        errors: [],
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
      },
      hpp: {
        success: false,
        status: "error",
        data: [],
        errors: [],
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
        hppMap: new Map(),
      },
      grosir: {
        success: false,
        status: "error",
        data: [],
        errors: [],
        warnings: [],
        summary: { totalRows: 0, parsedRows: 0, validRows: 0, errorRows: 0 },
        grosirMap: new Map(),
      },
      stockMovements: [],
      saldoSyncResult: null,
      incomeImported: false,
      adjustmentsImported: false,
      hppImported: false,
      transactionCommitted: false,
      errors: ["Tidak ada file yang diupload"],
    };
  }

  /* 6. Fetch existing income for idempotency (PRD 3.10 rules 2-4) */
  console.log('[DEBUG] Ready to run orchestrator:', {
    hasOrder: !!payload.orderBuffer,
    hasIncome: !!payload.incomeBuffer,
  });
  if (needsIncomeFetch) {
    try {
      payload.existingIncome = await fetchExistingIncome(client);
    } catch (err) {
      console.warn("Gagal fetch income untuk check duplikat:", err);
      // Continue anyway but may create duplicates on re-import
    }
  }

  /* 7. Run orchestrator */
  const orchestrator = new ImportOrchestrator(client);
  const result = await orchestrator.run(payload);
  console.log('[DEBUG] Orchestrator result:', {
    success: result.success,
    transactionCommitted: result.transactionCommitted,
    ordersSuccess: result.orders.success,
    incomeSuccess: result.income.success,
    errors: result.errors,
    toUpdateLength: result.income?.toUpdate?.length || 0,
  });

  /* Post-import triggers: sync income and recalc profit if needed */
  if (result.transactionCommitted) {
    // Trigger income sync if income was imported (either INSERT or UPDATE)
    if (result.incomeImported || result.income.toUpdate?.length > 0) {
      (async () => {
        try {
          const clientTrigger = await createServerClient();
          // Get store_id from settings (first row)
          const { data: setting, error } = await clientTrigger
            .from("settings")
            .select("store_id")
            .single();

          if (error) {
            console.warn("Gagal fetch store_id dari settings:", error.message);
            return;
          }

          if (!setting?.store_id) {
            console.warn("Tidak ditemukan store_id di settings");
            return;
          }

          const storeId = setting.store_id;
          await incomeSyncAction(storeId);
        } catch (err) {
          console.error("Income sync triggered error:", err);
        }
      })();
    }

    // Trigger profit recalc if adjustments or HPP were imported
    if (result.adjustmentsImported || result.hppImported) {
      (async () => {
        try {
          const clientTrigger = await createServerClient();
          // Get store_id from settings (first row)
          const { data: setting, error } = await clientTrigger
            .from("settings")
            .select("store_id")
            .single();

          if (error) {
            console.warn("Gagal fetch store_id dari settings:", error.message);
            return;
          }

          if (!setting?.store_id) {
            console.warn("Tidak ditemukan store_id di settings");
            return;
          }

          const storeId = setting.store_id;
          await profitRecalculateAction(storeId);
        } catch (err) {
          console.error("Profit recalc triggered error:", err);
        }
      })();
    }
  }

  return result;
}
