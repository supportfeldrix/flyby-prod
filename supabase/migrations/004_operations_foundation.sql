-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Operations Foundation
-- Migration: 004_operations_foundation.sql
-- Sprint 3: Customers, Farms, Fields
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Creates the operational tables for managing drone spray clients.
-- All tables include company_id for multi-tenant isolation via RLS.
--
-- Hierarchy: Company → Customers → Farms → Fields
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────
-- Represents a farm owner or spray client. Each customer belongs to one company.
CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_name   TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  billing_address TEXT,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.customers IS 'Spray clients / farm owners. Each customer belongs to one company.';

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_name ON public.customers(customer_name);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_customers_updated_at') THEN
    CREATE TRIGGER set_customers_updated_at
      BEFORE UPDATE ON public.customers
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FARMS
-- ─────────────────────────────────────────────────────────────────────────────
-- A physical farm location belonging to a customer. Contains multiple fields.
CREATE TABLE IF NOT EXISTS public.farms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  farm_name       TEXT NOT NULL,
  province        TEXT,
  town            TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.farms IS 'Physical farm locations. Each farm belongs to a customer and contains multiple fields.';

CREATE INDEX IF NOT EXISTS idx_farms_company_id ON public.farms(company_id);
CREATE INDEX IF NOT EXISTS idx_farms_customer_id ON public.farms(customer_id);
CREATE INDEX IF NOT EXISTS idx_farms_farm_name ON public.farms(farm_name);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_farms_updated_at') THEN
    CREATE TRIGGER set_farms_updated_at
      BEFORE UPDATE ON public.farms
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIELDS
-- ─────────────────────────────────────────────────────────────────────────────
-- A spray field within a farm. The fundamental unit of work for missions.
CREATE TABLE IF NOT EXISTS public.fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  farm_id         UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_name      TEXT NOT NULL,
  crop            TEXT,
  area_hectares   DOUBLE PRECISION CHECK (area_hectares > 0),
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  boundary        JSONB,                -- Future: GeoJSON polygon for field boundaries
  wind_limit      DOUBLE PRECISION,     -- Max wind speed (km/h) safe for spraying this field
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fields IS 'Spray fields within farms. The fundamental unit of work for missions.';
COMMENT ON COLUMN public.fields.boundary IS 'Future: GeoJSON polygon defining field boundaries.';
COMMENT ON COLUMN public.fields.wind_limit IS 'Maximum wind speed (km/h) safe for spraying this field.';

CREATE INDEX IF NOT EXISTS idx_fields_company_id ON public.fields(company_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm_id ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_fields_field_name ON public.fields(field_name);
CREATE INDEX IF NOT EXISTS idx_fields_crop ON public.fields(crop);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_fields_updated_at') THEN
    CREATE TRIGGER set_fields_updated_at
      BEFORE UPDATE ON public.fields
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- ─── CUSTOMERS POLICIES ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "customers_select" ON public.customers;
CREATE POLICY "customers_select"
  ON public.customers FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "customers_insert" ON public.customers;
CREATE POLICY "customers_insert"
  ON public.customers FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "customers_update" ON public.customers;
CREATE POLICY "customers_update"
  ON public.customers FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "customers_delete" ON public.customers;
CREATE POLICY "customers_delete"
  ON public.customers FOR DELETE
  USING (company_id = public.get_my_company_id());

-- ─── FARMS POLICIES ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "farms_select" ON public.farms;
CREATE POLICY "farms_select"
  ON public.farms FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "farms_insert" ON public.farms;
CREATE POLICY "farms_insert"
  ON public.farms FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "farms_update" ON public.farms;
CREATE POLICY "farms_update"
  ON public.farms FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "farms_delete" ON public.farms;
CREATE POLICY "farms_delete"
  ON public.farms FOR DELETE
  USING (company_id = public.get_my_company_id());

-- ─── FIELDS POLICIES ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "fields_select" ON public.fields;
CREATE POLICY "fields_select"
  ON public.fields FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "fields_insert" ON public.fields;
CREATE POLICY "fields_insert"
  ON public.fields FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "fields_update" ON public.fields;
CREATE POLICY "fields_update"
  ON public.fields FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "fields_delete" ON public.fields;
CREATE POLICY "fields_delete"
  ON public.fields FOR DELETE
  USING (company_id = public.get_my_company_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Operations foundation tables ready.
-- ═══════════════════════════════════════════════════════════════════════════════
