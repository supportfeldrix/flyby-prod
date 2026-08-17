-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Operational Readiness
-- Migration: 007_operational_readiness.sql
-- Sprint 4.3: Battery Sets, Equipment, Readiness Engine
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BATTERY SETS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.battery_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  battery_code      TEXT NOT NULL,
  aircraft_id       UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,
  manufacturer      TEXT,
  model             TEXT,
  serial_number     TEXT,
  capacity_mah      INTEGER CHECK (capacity_mah > 0),
  charge_cycles     INTEGER NOT NULL DEFAULT 0 CHECK (charge_cycles >= 0),
  battery_health    INTEGER NOT NULL DEFAULT 100 CHECK (battery_health >= 0 AND battery_health <= 100),
  current_charge    INTEGER NOT NULL DEFAULT 0 CHECK (current_charge >= 0 AND current_charge <= 100),
  temperature       DOUBLE PRECISION,
  status            TEXT NOT NULL DEFAULT 'Ready'
                    CHECK (status IN ('Charging', 'Ready', 'Cooling', 'In Use', 'Maintenance', 'Retired')),
  last_charged_at   TIMESTAMPTZ,
  last_used_at      TIMESTAMPTZ,
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.battery_sets IS 'Drone battery packs. Each battery can be assigned to one aircraft.';

CREATE INDEX IF NOT EXISTS idx_battery_sets_company_id ON public.battery_sets(company_id);
CREATE INDEX IF NOT EXISTS idx_battery_sets_aircraft_id ON public.battery_sets(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_battery_sets_status ON public.battery_sets(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_battery_sets_code_company
  ON public.battery_sets(company_id, battery_code) WHERE battery_code IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_battery_sets_updated_at') THEN
    CREATE TRIGGER set_battery_sets_updated_at
      BEFORE UPDATE ON public.battery_sets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EQUIPMENT
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_name      TEXT NOT NULL,
  equipment_type      TEXT DEFAULT 'Spray Nozzle'
                      CHECK (equipment_type IN ('Spray Nozzle', 'Pump', 'Tank', 'GPS Module', 'RTK Base', 'Camera', 'Spreader', 'Sensor', 'Other')),
  aircraft_id         UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'Ready'
                      CHECK (status IN ('Ready', 'In Use', 'Calibration Due', 'Maintenance', 'Retired')),
  last_calibration    DATE,
  next_calibration    DATE,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.equipment IS 'Spray and survey equipment. Assigned to aircraft for mission readiness.';

CREATE INDEX IF NOT EXISTS idx_equipment_company_id ON public.equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_aircraft_id ON public.equipment(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_equipment_updated_at') THEN
    CREATE TRIGGER set_equipment_updated_at
      BEFORE UPDATE ON public.equipment
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.battery_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Battery policies
DROP POLICY IF EXISTS "battery_sets_select" ON public.battery_sets;
CREATE POLICY "battery_sets_select" ON public.battery_sets FOR SELECT
  USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "battery_sets_insert" ON public.battery_sets;
CREATE POLICY "battery_sets_insert" ON public.battery_sets FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "battery_sets_update" ON public.battery_sets;
CREATE POLICY "battery_sets_update" ON public.battery_sets FOR UPDATE
  USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "battery_sets_delete" ON public.battery_sets;
CREATE POLICY "battery_sets_delete" ON public.battery_sets FOR DELETE
  USING (company_id = public.get_my_company_id());

-- Equipment policies
DROP POLICY IF EXISTS "equipment_select" ON public.equipment;
CREATE POLICY "equipment_select" ON public.equipment FOR SELECT
  USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "equipment_insert" ON public.equipment;
CREATE POLICY "equipment_insert" ON public.equipment FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "equipment_update" ON public.equipment;
CREATE POLICY "equipment_update" ON public.equipment FOR UPDATE
  USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "equipment_delete" ON public.equipment;
CREATE POLICY "equipment_delete" ON public.equipment FOR DELETE
  USING (company_id = public.get_my_company_id());
