-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Aircraft Management
-- Migration: 005_aircraft_management.sql
-- Sprint 4.1: Professional Fleet Management
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Creates the aircraft table for drone fleet management.
-- Supports: registration, maintenance tracking, insurance, flight hours,
-- firmware versioning, and photo storage via Supabase Storage.
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AIRCRAFT TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aircraft (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  aircraft_name         TEXT NOT NULL,
  manufacturer          TEXT,
  model                 TEXT,
  serial_number         TEXT,
  registration_number   TEXT,
  aircraft_type         TEXT DEFAULT 'Spray Drone'
                        CHECK (aircraft_type IN ('Spray Drone', 'Survey Drone', 'Mapping Drone', 'Multirole', 'Other')),
  purchase_date         DATE,
  purchase_price        NUMERIC(12, 2),
  firmware_version      TEXT,
  status                TEXT NOT NULL DEFAULT 'Ready'
                        CHECK (status IN ('Ready', 'In Mission', 'Maintenance', 'Offline', 'Retired')),
  flight_hours          DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (flight_hours >= 0),
  total_missions        INTEGER NOT NULL DEFAULT 0 CHECK (total_missions >= 0),
  total_hectares        DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (total_hectares >= 0),
  last_flight_date      DATE,
  last_service_date     DATE,
  next_service_date     DATE,
  insurance_expiry      DATE,
  notes                 TEXT,
  photo_url             TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.aircraft IS 'Drone fleet management. Each aircraft belongs to one company.';
COMMENT ON COLUMN public.aircraft.status IS 'Operational status: Ready, In Mission, Maintenance, Offline, Retired.';
COMMENT ON COLUMN public.aircraft.flight_hours IS 'Total cumulative flight hours for this aircraft.';
COMMENT ON COLUMN public.aircraft.photo_url IS 'URL to aircraft photo in Supabase Storage (bucket: aircraft).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_aircraft_company_id ON public.aircraft(company_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON public.aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON public.aircraft(registration_number);
CREATE INDEX IF NOT EXISTS idx_aircraft_manufacturer ON public.aircraft(manufacturer);

-- Unique constraints per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_aircraft_serial_unique
  ON public.aircraft(serial_number) WHERE serial_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_aircraft_registration_company
  ON public.aircraft(company_id, registration_number) WHERE registration_number IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGER: auto-update updated_at
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_aircraft_updated_at') THEN
    CREATE TRIGGER set_aircraft_updated_at
      BEFORE UPDATE ON public.aircraft
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aircraft_select" ON public.aircraft;
CREATE POLICY "aircraft_select"
  ON public.aircraft FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "aircraft_insert" ON public.aircraft;
CREATE POLICY "aircraft_insert"
  ON public.aircraft FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "aircraft_update" ON public.aircraft;
CREATE POLICY "aircraft_update"
  ON public.aircraft FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "aircraft_delete" ON public.aircraft;
CREATE POLICY "aircraft_delete"
  ON public.aircraft FOR DELETE
  USING (company_id = public.get_my_company_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SUPABASE STORAGE BUCKET (run manually in Supabase dashboard if needed)
-- ─────────────────────────────────────────────────────────────────────────────
-- Note: Storage bucket creation via SQL requires service_role access.
-- If this fails, create the bucket manually in the Supabase Dashboard:
--   Storage → New Bucket → Name: "aircraft" → Public: true
--
INSERT INTO storage.buckets (id, name, public)
VALUES ('aircraft', 'aircraft', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow authenticated users to manage their own uploads
DROP POLICY IF EXISTS "aircraft_photos_select" ON storage.objects;
CREATE POLICY "aircraft_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aircraft');

DROP POLICY IF EXISTS "aircraft_photos_insert" ON storage.objects;
CREATE POLICY "aircraft_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'aircraft' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aircraft_photos_update" ON storage.objects;
CREATE POLICY "aircraft_photos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'aircraft' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aircraft_photos_delete" ON storage.objects;
CREATE POLICY "aircraft_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'aircraft' AND auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Aircraft fleet management table ready.
-- ═══════════════════════════════════════════════════════════════════════════════
