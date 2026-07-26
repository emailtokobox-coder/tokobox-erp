/**
 * @module features/upload/actions/getImportHistoryAction
 * Server Action — fetches recent import history from the database.
 *
 * Queries the most recent orders as a proxy for import history.
 * In the future, this can be replaced with a dedicated import_history table.
 *
 * Usage in components:
 *   const history = await getImportHistoryAction({ page: 1, pageSize: 20 });
 */

import { createSupabaseClient } from "@/lib/supabase/client";

/* ─── Import History Entry ─── */

export interface ImportHistoryEntry {
  noPesanan: string;
  statusOrderFinal: string;
  statusHpp: string;
  statusIncome: string;
  totalQtyOrder: number;
  totalOmzetValid: number;
  importDate: string;
  itemCount: number;
}

export interface ImportHistoryResult {
  data: ImportHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/* ─── Server Action ─── */

/**
 * Fetch recent import history.
 * Returns paginated list of orders sorted by import date (newest first).
 *
 * @param filter - Optional filter parameters
 * @returns Paginated import history
 */
export async function getImportHistoryAction(
  filter?: { page?: number; pageSize?: number; search?: string }
): Promise<ImportHistoryResult> {
  const client = createSupabaseClient();

  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("orders")
    .select("*", { count: "exact" })
    .order("import_date", { ascending: false })
    .range(from, to);

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    query = query.or(`no_pesanan.ilike.%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
    };
  }

  const entries: ImportHistoryEntry[] = (data ?? []).map((row) => ({
    noPesanan: row.no_pesanan ?? "",
    statusOrderFinal: row.status_order_final ?? "",
    statusHpp: row.status_hpp ?? "",
    statusIncome: row.status_income ?? "",
    totalQtyOrder: row.total_qty_order ?? 0,
    totalOmzetValid: row.total_omzet_valid ?? 0,
    importDate: row.import_date ?? "",
    itemCount: row.item_count ?? 0,
  }));

  return {
    data: entries,
    total: count ?? 0,
    page,
    pageSize,
  };
}
