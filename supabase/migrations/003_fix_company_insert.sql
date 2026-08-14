-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Fix Company INSERT During Onboarding
-- Migration: 003_fix_company_insert.sql
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
--   During company setup, the user's profile has company_id = NULL.
--   The INSERT on companies uses .select().single() (Supabase JS returns
--   the inserted row). This requires both INSERT and SELECT policies to pass.
--   
--   The SELECT policy "companies_select_own" checks:
--     id = get_my_company_id()
--   But get_my_company_id() returns NULL because the profile hasn't been
--   updated yet → id = NULL is always false → row can't be read back
--   → Supabase reports "new row violates row-level security policy".
--
-- SOLUTION:
--   Add a SELECT policy allowing users to read companies they created.
--   This covers the onboarding window before profile.company_id is updated.
--
-- EXECUTION:
--   Run this in the Supabase SQL Editor after 002_fix_rls_recursion.sql.
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Allow users to SELECT companies they created (covers onboarding)
DROP POLICY IF EXISTS "companies_select_creator" ON public.companies;
CREATE POLICY "companies_select_creator"
  ON public.companies FOR SELECT
  USING (auth.uid() = created_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Company creation during onboarding will now succeed.
-- The user can read back the row they just inserted because they are the creator.
-- ═══════════════════════════════════════════════════════════════════════════════
