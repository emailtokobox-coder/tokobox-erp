/**
 * @module lib/database
 * Database utilities — transaction wrapper and Supabase client factory.
 */

export { DbTransaction, type TransactionResult } from "./transaction";
export { createSupabaseClient } from "@/lib/supabase/client";
