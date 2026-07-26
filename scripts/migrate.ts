/**
 * @module scripts/migrate
 * Apply Supabase migrations from SQL file.
 *
 * Requirements:
 *   - SUPABASE_PROJECT_ID in .env (project ref)
 *   - SUPABASE_SERVICE_ROLE_KEY in .env (secret key for DDL operations)
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service_role key for DDL operations (create policy, etc.)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const __filename = new URL(import.meta.url).pathname;
  const rootDir = __filename.startsWith("/") ? __filename : ".";
  const projectRoot = rootDir.includes("scripts") ? rootDir.substring(0, rootDir.indexOf("/scripts")) : "./";
  const migrationFile = resolve(projectRoot, "supabase/migrations/001_rls_policies.sql");

  if (!migrationFile) {
    throw new Error("Migration file path could not be resolved");
  }

  const sql = readFileSync(migrationFile, "utf-8");

  console.log("Applying RLS migration...");

  // Split by semicolons to handle multiple statements
  const statements = sql.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);

    const { error } = await supabase.sql.query(stmt);
    if (error) {
      console.error(`  ✗ Failed:`, error.message);
      console.error(`  Hint: Check row ${i + 1} in migration file`);
      process.exit(1);
    }
    console.log("  ✓ OK");
  }

  console.log(`Migration complete. ${statements.length} statements applied.`);
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
