-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Asset Management Platform
-- Migration: 014_asset_management.sql
-- Sprint 5.4: Company Assets, Categories, Mission Asset Assignment
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ASSET CATEGORIES (configurable per company)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.asset_categories IS 'Configurable asset categories per company.';

CREATE INDEX IF NOT EXISTS idx_asset_categories_company ON public.asset_categories(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_categories_name_company
  ON public.asset_categories(company_id, name);

ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asset_categories_all" ON public.asset_categories;
CREATE POLICY "asset_categories_all" ON public.asset_categories FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- Seed default categories (inserted per-company on first access via service)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ASSETS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  asset_name        TEXT NOT NULL,
  category_name     TEXT,
  brand             TEXT,
  model             TEXT,
  serial_number     TEXT,
  asset_number      TEXT,
  purchase_date     DATE,
  purchase_price    NUMERIC(12,2),
  warranty_expiry   DATE,
  supplier          TEXT,
  current_location  TEXT,
  photo_url         TEXT,
  status            TEXT NOT NULL DEFAULT 'Available'
                    CHECK (status IN ('Available', 'Reserved', 'In Mission', 'Maintenance', 'Out of Service', 'Retired')),
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Future placeholders
  qr_code           TEXT,
  barcode           TEXT,
  last_inspection   DATE,
  next_service_date DATE,
  fuel_type         TEXT,
  gps_tracker_id    TEXT
);

COMMENT ON TABLE public.assets IS 'Company-owned equipment and assets used in drone operations.';

CREATE INDEX IF NOT EXISTS idx_assets_company ON public.assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_number_company
  ON public.assets(company_id, asset_number) WHERE asset_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_serial_company
  ON public.assets(company_id, serial_number) WHERE serial_number IS NOT NULL;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assets_select" ON public.assets;
CREATE POLICY "assets_select" ON public.assets FOR SELECT USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "assets_insert" ON public.assets;
CREATE POLICY "assets_insert" ON public.assets FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "assets_update" ON public.assets;
CREATE POLICY "assets_update" ON public.assets FOR UPDATE USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "assets_delete" ON public.assets;
CREATE POLICY "assets_delete" ON public.assets FOR DELETE USING (company_id = public.get_my_company_id());

-- Updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_assets_updated_at') THEN
    CREATE TRIGGER set_assets_updated_at
      BEFORE UPDATE ON public.assets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MISSION ASSETS (many-to-many: missions ↔ assets)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_id  UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  asset_id    UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  notes       TEXT,

  CONSTRAINT idx_mission_assets_unique UNIQUE (mission_id, asset_id)
);

COMMENT ON TABLE public.mission_assets IS 'Assets assigned to missions. Tracks assignment and release times.';

CREATE INDEX IF NOT EXISTS idx_mission_assets_company ON public.mission_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_mission_assets_mission ON public.mission_assets(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_assets_asset ON public.mission_assets(asset_id);

ALTER TABLE public.mission_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_assets_all" ON public.mission_assets;
CREATE POLICY "mission_assets_all" ON public.mission_assets FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Supabase Storage bucket 'asset-images' must be created via Dashboard:
--   Path convention: {company_id}/{asset_id}/{filename}
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Asset Management schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
