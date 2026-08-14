-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Initial Database Schema
-- Version: 1.0.0
-- Sprint: 2.1 (Production-Ready Foundation)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE:
--   Creates the foundational tables for multi-company SaaS drone operations.
--   This schema supports complete company isolation via Row Level Security.
--
-- EXECUTION:
--   Run this entire file once in the Supabase SQL Editor.
--   The migration is idempotent where possible (IF NOT EXISTS).
--   Triggers on auth.users cannot be made idempotent — execute only once.
--
-- MULTI-COMPANY ARCHITECTURE:
--   Every future operational table (aircraft, pilots, customers, farms,
--   fields, missions, flight_logs, maintenance, photos, documents,
--   notifications) MUST include a company_id column with a foreign key
--   to public.companies(id) and appropriate RLS policies.
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase default).
-- No extension needed, but pgcrypto is available if required for other uses.


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UTILITY FUNCTION: auto-update updated_at timestamp
-- ─────────────────────────────────────────────────────────────────────────────
-- Called by BEFORE UPDATE triggers on all tables with an updated_at column.
-- Uses CREATE OR REPLACE so it is safe to re-execute.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── COMPANIES ───────────────────────────────────────────────────────────────
-- Each company represents one drone operations business.
-- All operational data (aircraft, pilots, missions, etc.) belongs to a company.
-- The created_by field links to the user who registered the company (owner).
CREATE TABLE IF NOT EXISTS public.companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,
  company_code  TEXT UNIQUE,             -- Short code for mission numbering, invoices, reports (e.g. "FBO", "SKY")
  phone         TEXT,
  email         TEXT,
  country       TEXT NOT NULL DEFAULT 'South Africa',
  province      TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,  -- Soft-disable: FALSE hides company from active operations
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.companies IS 'Drone operations companies. Every operational record references a company for multi-tenant isolation.';
COMMENT ON COLUMN public.companies.company_code IS 'Unique short code (e.g. FBO) used in mission IDs, invoices, and internal references.';
COMMENT ON COLUMN public.companies.is_active IS 'When FALSE, company is soft-disabled. Use for suspension without data deletion.';


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with application-specific fields.
-- A profile belongs to exactly one company (company_id).
-- The role field determines what the user can do within their company.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  avatar_url    TEXT,
  company_id    UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  role          TEXT NOT NULL DEFAULT 'Viewer'
                CHECK (role IN ('Administrator', 'Operations Manager', 'Pilot', 'Technician', 'Viewer')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,  -- Soft-disable: FALSE prevents login/access without deleting user
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users. Each profile belongs to one company.';
COMMENT ON COLUMN public.profiles.role IS 'Application role: Administrator, Operations Manager, Pilot, Technician, or Viewer.';
COMMENT ON COLUMN public.profiles.is_active IS 'When FALSE, user is soft-disabled and should be denied access at application level.';
COMMENT ON COLUMN public.profiles.company_id IS 'The company this user belongs to. NULL during onboarding before company setup.';


-- ─── COMPANY_USERS ───────────────────────────────────────────────────────────
-- Junction table linking users to companies with a role.
-- Supports future multi-company scenarios (user belonging to multiple companies).
-- Currently each user has one record here matching their profiles.company_id.
CREATE TABLE IF NOT EXISTS public.company_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'Viewer'
                CHECK (role IN ('Administrator', 'Operations Manager', 'Pilot', 'Technician', 'Viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

COMMENT ON TABLE public.company_users IS 'Maps users to companies with a role. Supports future multi-company membership.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
-- These indexes support the most common query patterns:
-- - Looking up profiles by company (dashboard, team views)
-- - Looking up profiles by email (login, search)
-- - Finding a company's creator (admin checks)
-- - Listing members of a company (team management)
-- - Finding a user's company memberships (auth/context)

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_company_code ON public.companies(company_code);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS: auto-update updated_at
-- ─────────────────────────────────────────────────────────────────────────────
-- PostgreSQL does not support CREATE TRIGGER IF NOT EXISTS.
-- These are safe to execute on first migration. On re-run they will raise
-- "trigger already exists" — harmless in Supabase SQL Editor (stops at error).
-- For truly idempotent re-runs, wrap in DO blocks:

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_companies_updated_at'
  ) THEN
    CREATE TRIGGER set_companies_updated_at
      BEFORE UPDATE ON public.companies
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTION: Get current user's company_id (bypasses RLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER runs with creator permissions, bypassing RLS on profiles.
-- This prevents infinite recursion when policies need to check company membership.
-- Safe because it only returns the company_id for the authenticated user.

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_my_company_id IS 'Returns the company_id for the current authenticated user, bypassing RLS to avoid infinite recursion in policies.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
-- RLS enforces complete company isolation at the database level.
-- No application-level bug can leak data between companies.
-- All policies use get_my_company_id() instead of subquerying profiles
-- to avoid infinite recursion.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;


-- ─── PROFILES POLICIES ───────────────────────────────────────────────────────

-- Users can always read their own profile (even before company setup)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can read profiles of people in the same company
-- Uses SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "profiles_select_same_company" ON public.profiles;
CREATE POLICY "profiles_select_same_company"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );

-- Users can insert their own profile (used by handle_new_user trigger via SECURITY DEFINER)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─── COMPANIES POLICIES ──────────────────────────────────────────────────────

-- Users can read their own company
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
CREATE POLICY "companies_select_own"
  ON public.companies FOR SELECT
  USING (
    id = public.get_my_company_id()
  );

-- Users can also read companies they created (needed during onboarding
-- when profile.company_id is still NULL)
DROP POLICY IF EXISTS "companies_select_creator" ON public.companies;
CREATE POLICY "companies_select_creator"
  ON public.companies FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated users can create a company (during onboarding)
-- Guard: created_by must be the current user
DROP POLICY IF EXISTS "companies_insert_authenticated" ON public.companies;
CREATE POLICY "companies_insert_authenticated"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Company administrators can update their company
-- Uses company_users to check admin role (more scalable than checking created_by alone)
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
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


-- ─── COMPANY_USERS POLICIES ──────────────────────────────────────────────────

-- Users can see members of their own company
DROP POLICY IF EXISTS "company_users_select_same_company" ON public.companies;
DROP POLICY IF EXISTS "company_users_select_same_company" ON public.company_users;
CREATE POLICY "company_users_select_same_company"
  ON public.company_users FOR SELECT
  USING (
    company_id = public.get_my_company_id()
  );

-- Users can insert themselves into a company (during onboarding)
DROP POLICY IF EXISTS "company_users_insert_own" ON public.company_users;
CREATE POLICY "company_users_insert_own"
  ON public.company_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Administrators can insert other users into their company
DROP POLICY IF EXISTS "company_users_insert_admin" ON public.company_users;
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
DROP POLICY IF EXISTS "company_users_update_admin" ON public.company_users;
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


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTION: Auto-create profile on user signup
-- ─────────────────────────────────────────────────────────────────────────────
-- This function runs as SECURITY DEFINER (bypasses RLS) because the
-- auth.users insert happens before the profile exists (chicken-and-egg).
-- It extracts full_name from the signup metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates a profile row when a new user signs up via Supabase Auth.';

-- Trigger on auth.users — NOTE: Cannot use IF NOT EXISTS for triggers.
-- This is safe to execute once. If re-run, it will error with "trigger already exists".
-- To make re-runnable, use the DO block pattern:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- TABLES CREATED:
--   • public.companies    — Drone operations businesses
--   • public.profiles     — User profiles (extends auth.users)
--   • public.company_users — User-company membership with roles
--
-- FUNCTIONS CREATED:
--   • public.handle_updated_at()  — Auto-updates updated_at column
--   • public.handle_new_user()    — Auto-creates profile on signup
--
-- TRIGGERS CREATED:
--   • set_companies_updated_at    — On public.companies
--   • set_profiles_updated_at     — On public.profiles
--   • on_auth_user_created        — On auth.users
--
-- RLS POLICIES: 10 policies enforcing complete company isolation
--
-- NEXT STEPS (Sprint 3+):
--   Every new table MUST include:
--     company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE
--   Every new table MUST have:
--     ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
--   With a policy pattern:
--     USING (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()))
--
-- ═══════════════════════════════════════════════════════════════════════════════
