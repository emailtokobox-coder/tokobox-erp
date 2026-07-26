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

import { createSupabaseClient } from "@/lib/supabase/client";
import { ImportOrchestrator } from "../services/ImportOrchestrator";
import type { ImportPayload, OrchestratorResult } from "../services/ImportOrchestrator";
import { profitRecalculateAction } from "@/features/finance/actions/profitRecalculateAction";
import { incomeSyncAction } from "@/features/finance/actions/incomeSyncAction";

/* ─── Helper: ArrayBuffer from File ─── */

function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/* ─── Server Action ─── */

/**
 * Import multiple Excel files into the database.
 *
 * @param formData - FormData containing optional files:
 *   - orderFile: File (Order All)
 *   - incomeFile: File (Income)
 *   - adjustmentFile: File (Adjustment)
 *   - hppFile: File (HPP)
 *   - grosirFile: File (Grosir)
 * @returns OrchestratorResult with parse results and transaction status
 */
export async function importFilesAction(
  formData: FormData
): Promise<OrchestratorResult> {
  /* 1. Create Supabase client */
  const client = createSupabaseClient();

  /* 2. Build payload from FormData */
  const payload: ImportPayload = {};

  const orderFile = formData.get("orderFile");
  if (orderFile instanceof File) {
    payload.orderBuffer = await fileToBuffer(orderFile);
  }

  const incomeFile = formData.get("incomeFile");
  if (incomeFile instanceof File) {
    payload.incomeBuffer = await fileToBuffer(incomeFile);
  }

  const adjustmentFile = formData.get("adjustmentFile");
  if (adjustmentFile instanceof File) {
    payload.adjustmentBuffer = await fileToBuffer(adjustmentFile);
  }

  const hppFile = formData.get("hppFile");
  if (hppFile instanceof File) {
    payload.hppBuffer = await fileToBuffer(hppFile);
  }

  const grosirFile = formData.get("grosirFile");
  if (grosirFile instanceof File) {
    payload.grosirBuffer = await fileToBuffer(grosirFile);
  }

  /* 3. Check if any files were provided */
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

  /* 4. Run orchestrator */
  const orchestrator = new ImportOrchestrator(client);
  const result = await orchestrator.run(payload);

  /* Post-import triggers: sync income and recalc profit if needed */
  if (result.transactionCommitted) {
    // Trigger income sync if income was imported
    if (result.incomeImported) {
      (async () => {
        try {
          const clientTrigger = createSupabaseClient();
          // Get storeId from settings (first row)
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
          const clientTrigger = createSupabaseClient();
          // Get storeId from settings (first row)
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
