-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Mission Planner
-- Migration: 008_mission_planner.sql
-- Sprint 4.5: Intelligent Mission Planner
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MISSION NUMBER SEQUENCE (per-company auto-increment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_sequences (
  company_id  UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.mission_sequences IS 'Per-company auto-increment counter for mission numbers.';

ALTER TABLE public.mission_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_sequences_all" ON public.mission_sequences;
CREATE POLICY "mission_sequences_all" ON public.mission_sequences FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MISSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.missions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_number          TEXT NOT NULL,
  customer_id             UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  farm_id                 UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  field_id                UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  aircraft_id             UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,
  pilot_id                UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
  battery_id              UUID REFERENCES public.battery_sets(id) ON DELETE SET NULL,
  equipment_id            UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  scheduled_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  recommended_start       TIME,
  recommended_finish      TIME,
  manual_start            TIME,
  manual_finish           TIME,
  priority                TEXT NOT NULL DEFAULT 'Normal'
                          CHECK (priority IN ('Critical', 'High', 'Normal', 'Low')),
  status                  TEXT NOT NULL DEFAULT 'Draft'
                          CHECK (status IN ('Draft', 'Planned', 'Ready', 'Dispatched', 'In Progress', 'Completed', 'Cancelled')),
  crop                    TEXT,
  application_type        TEXT DEFAULT 'Spray'
                          CHECK (application_type IN ('Spray', 'Spread', 'Survey', 'Mapping', 'Inspection', 'Other')),
  chemical_name           TEXT,
  application_rate        DOUBLE PRECISION,
  estimated_area          DOUBLE PRECISION,
  estimated_duration      INTEGER,          -- minutes
  estimated_battery_usage INTEGER,          -- percentage
  weather_snapshot        JSONB,            -- snapshot of weather at planning time
  flight_risk_score       INTEGER,          -- 0-100
  dispatcher_notes        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.missions IS 'Planned spray missions. Links all operational resources for dispatch.';
COMMENT ON COLUMN public.missions.mission_number IS 'Auto-generated: FLY-YYYY-NNNNNN';
COMMENT ON COLUMN public.missions.weather_snapshot IS 'JSONB snapshot of weather conditions at planning time.';
COMMENT ON COLUMN public.missions.flight_risk_score IS 'Computed risk score 0-100 at planning time.';

-- Unique mission numbers per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_missions_number_company
  ON public.missions(company_id, mission_number);

CREATE INDEX IF NOT EXISTS idx_missions_company_id ON public.missions(company_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_scheduled_date ON public.missions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_missions_customer_id ON public.missions(customer_id);
CREATE INDEX IF NOT EXISTS idx_missions_field_id ON public.missions(field_id);
CREATE INDEX IF NOT EXISTS idx_missions_pilot_id ON public.missions(pilot_id);
CREATE INDEX IF NOT EXISTS idx_missions_aircraft_id ON public.missions(aircraft_id);

-- Trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_missions_updated_at') THEN
    CREATE TRIGGER set_missions_updated_at
      BEFORE UPDATE ON public.missions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "missions_select" ON public.missions;
CREATE POLICY "missions_select" ON public.missions FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "missions_insert" ON public.missions;
CREATE POLICY "missions_insert" ON public.missions FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "missions_update" ON public.missions;
CREATE POLICY "missions_update" ON public.missions FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "missions_delete" ON public.missions;
CREATE POLICY "missions_delete" ON public.missions FOR DELETE
  USING (company_id = public.get_my_company_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Mission Planner schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
