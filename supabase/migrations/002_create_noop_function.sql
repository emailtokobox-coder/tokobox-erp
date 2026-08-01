-- =========================================================
-- Migration 002: Create noop() function for transaction headers
-- =========================================================
--
-- Problem: DbTransaction.begin() calls rpc("noop") to carry
-- PostgREST transaction headers (Prefer: tx=uuid). Without
-- this function, every import fails with:
--   "Could not find the function public.noop without
--    parameters in the schema cache"
--
-- Solution: Create a no-op PostgreSQL function that does
-- nothing. The real work is done by the Prefer: tx=uuid
-- headers, not by the function body.
--
-- Usage: Run this SQL in Supabase Dashboard → SQL Editor
-- =========================================================

CREATE OR REPLACE FUNCTION public.noop()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Intentionally empty.
  -- Called via RPC solely to carry PostgREST transaction
  -- headers (Prefer: tx=uuid, tx=uuid:<id>:commit,
  -- tx=uuid:<id>:rollback). The function body does nothing;
  -- the headers control the transaction lifecycle.
END;
$$;

-- Grant execute to anon and authenticated roles so the
-- Supabase client can call it without privilege errors.
GRANT EXECUTE ON FUNCTION public.noop() TO anon;
GRANT EXECUTE ON FUNCTION public.noop() TO authenticated;
