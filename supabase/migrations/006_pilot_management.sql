-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Pilot Management
-- Migration: 006_pilot_management.sql
-- Sprint 4.2: Professional Pilot Management
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pilots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  display_name          TEXT,
  email                 TEXT,
  phone                 TEXT,
  photo_url             TEXT,
  pilot_code            TEXT,
  licence_number        TEXT,
  licence_type          TEXT DEFAULT 'Commercial RPL'
                        CHECK (licence_type IN ('Private RPL', 'Commercial RPL', 'Instructor', 'Student', 'Other')),
  licence_expiry        DATE,
  medical_expiry        DATE,
  operator_certificate  TEXT,
  hire_date             DATE,
  date_of_birth         DATE,
  status                TEXT NOT NULL DEFAULT 'Available'
                        CHECK (status IN ('Available', 'Flying', 'Standby', 'Training', 'On Leave', 'Off Duty', 'Inactive')),
  total_flight_hours    DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (total_flight_hours >= 0),
  total_missions        INTEGER NOT NULL DEFAULT 0 CHECK (total_missions >= 0),
  total_hectares        DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (total_hectares >= 0),
  preferred_aircraft    UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pilots IS 'Drone pilots. Each pilot belongs to one company.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pilots_company_id ON public.pilots(company_id);
CREATE INDEX IF NOT EXISTS idx_pilots_status ON public.pilots(status);
CREATE INDEX IF NOT EXISTS idx_pilots_licence_expiry ON public.pilots(licence_expiry);
CREATE INDEX IF NOT EXISTS idx_pilots_medical_expiry ON public.pilots(medical_expiry);

-- Unique constraints per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilots_code_company
  ON public.pilots(company_id, pilot_code) WHERE pilot_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilots_email_company
  ON public.pilots(company_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilots_licence_company
  ON public.pilots(company_id, licence_number) WHERE licence_number IS NOT NULL;

-- Trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pilots_updated_at') THEN
    CREATE TRIGGER set_pilots_updated_at
      BEFORE UPDATE ON public.pilots
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pilots_select" ON public.pilots;
CREATE POLICY "pilots_select" ON public.pilots FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilots_insert" ON public.pilots;
CREATE POLICY "pilots_insert" ON public.pilots FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilots_update" ON public.pilots;
CREATE POLICY "pilots_update" ON public.pilots FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilots_delete" ON public.pilots;
CREATE POLICY "pilots_delete" ON public.pilots FOR DELETE
  USING (company_id = public.get_my_company_id());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pilots', 'pilots', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "pilots_photos_select" ON storage.objects;
CREATE POLICY "pilots_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'pilots');

DROP POLICY IF EXISTS "pilots_photos_insert" ON storage.objects;
CREATE POLICY "pilots_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pilots' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "pilots_photos_update" ON storage.objects;
CREATE POLICY "pilots_photos_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'pilots' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "pilots_photos_delete" ON storage.objects;
CREATE POLICY "pilots_photos_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'pilots' AND auth.role() = 'authenticated');
