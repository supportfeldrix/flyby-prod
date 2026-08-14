-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Fix RLS Infinite Recursion
-- Migration: 002_fix_rls_recursion.sql
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
--   Policies on the profiles table reference profiles itself in subqueries:
--     (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
--   This causes infinite recursion because reading profiles triggers RLS
--   which evaluates the policy which reads profiles again → loop.
--
-- SOLUTION:
--   Create a SECURITY DEFINER function that reads the user's company_id
--   bypassing RLS. All policies then call this function instead of
--   subquerying profiles directly.
--
-- EXECUTION:
--   Run this entire file in the Supabase SQL Editor after 001_initial_schema.sql.
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. HELPER FUNCTION: Get the current user's company_id (bypasses RLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER means this function runs with the permissions of the
-- function creator (superuser), not the calling user. This lets it read
-- profiles without triggering RLS evaluation → no recursion.
-- It is safe because it only returns the company_id for auth.uid().

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_my_company_id IS 'Returns the company_id for the current authenticated user, bypassing RLS to avoid infinite recursion in policies.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DROP ALL EXISTING POLICIES (on all 3 tables)
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_same_company" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Companies policies
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;

-- Company_users policies
DROP POLICY IF EXISTS "company_users_select_same_company" ON public.company_users;
DROP POLICY IF EXISTS "company_users_insert_own" ON public.company_users;
DROP POLICY IF EXISTS "company_users_insert_admin" ON public.company_users;
DROP POLICY IF EXISTS "company_users_update_admin" ON public.company_users;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RECREATE PROFILES POLICIES (no self-referencing subqueries)
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can always read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can read profiles of people in the same company
-- Uses the SECURITY DEFINER function instead of subquerying profiles
CREATE POLICY "profiles_select_same_company"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );

-- Users can insert their own profile (used by handle_new_user trigger)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RECREATE COMPANIES POLICIES (using helper function)
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can read their own company
CREATE POLICY "companies_select_own"
  ON public.companies FOR SELECT
  USING (
    id = public.get_my_company_id()
  );

-- Authenticated users can create a company (during onboarding)
CREATE POLICY "companies_insert_authenticated"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Company administrators can update their company
CREATE POLICY "companies_update_admin"
  ON public.companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
        AND cu.user_id = auth.uid()
        AND cu.role = 'Administrator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
        AND cu.user_id = auth.uid()
        AND cu.role = 'Administrator'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RECREATE COMPANY_USERS POLICIES (using helper function)
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can see members of their own company
CREATE POLICY "company_users_select_same_company"
  ON public.company_users FOR SELECT
  USING (
    company_id = public.get_my_company_id()
  );

-- Users can insert themselves into a company (during onboarding)
CREATE POLICY "company_users_insert_own"
  ON public.company_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Administrators can insert other users into their company
CREATE POLICY "company_users_insert_admin"
  ON public.company_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'Administrator'
    )
  );

-- Administrators can update roles within their company
CREATE POLICY "company_users_update_admin"
  ON public.company_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'Administrator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'Administrator'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. RLS recursion is fixed.
--
-- KEY CHANGE:
--   All policies that need "what company does the current user belong to?"
--   now call public.get_my_company_id() instead of subquerying profiles.
--   This function is SECURITY DEFINER so it bypasses RLS on profiles,
--   breaking the infinite recursion chain.
--
-- ═══════════════════════════════════════════════════════════════════════════════
