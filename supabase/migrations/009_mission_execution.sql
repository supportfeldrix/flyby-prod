-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Mission Execution Engine
-- Migration: 009_mission_execution.sql
-- Sprint 5.0: Execution, Checklists, Flight Logs
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND MISSIONS TABLE — add execution statuses
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_status_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_status_check
  CHECK (status IN ('Draft', 'Planned', 'Ready', 'Dispatched', 'Pre Flight', 'Flying', 'Paused', 'Completed', 'Cancelled', 'Aborted', 'Emergency'));

-- Add execution columns
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN dispatched_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN started_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN actual_duration INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN actual_area DOUBLE PRECISION;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN actual_battery_used INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN completion_notes TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MISSION CHECKLISTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_key        TEXT NOT NULL,
  item_label      TEXT NOT NULL,
  checked         BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by      UUID REFERENCES auth.users(id),
  checked_at      TIMESTAMPTZ,
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mission_checklists IS 'Pre-flight checklist items for each mission.';

CREATE INDEX IF NOT EXISTS idx_mission_checklists_mission ON public.mission_checklists(mission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mission_checklists_unique ON public.mission_checklists(mission_id, item_key);

ALTER TABLE public.mission_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_checklists_select" ON public.mission_checklists;
CREATE POLICY "mission_checklists_select" ON public.mission_checklists FOR SELECT USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "mission_checklists_insert" ON public.mission_checklists;
CREATE POLICY "mission_checklists_insert" ON public.mission_checklists FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "mission_checklists_update" ON public.mission_checklists;
CREATE POLICY "mission_checklists_update" ON public.mission_checklists FOR UPDATE USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "mission_checklists_delete" ON public.mission_checklists;
CREATE POLICY "mission_checklists_delete" ON public.mission_checklists FOR DELETE USING (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MISSION EXECUTION LOGS (Flight Timeline)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_execution_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL
                  CHECK (event_type IN ('created', 'planned', 'dispatched', 'checklist_complete', 'takeoff', 'flying', 'paused', 'resumed', 'landing', 'completed', 'cancelled', 'aborted', 'emergency', 'note')),
  event_label     TEXT NOT NULL,
  user_id         UUID REFERENCES auth.users(id),
  user_name       TEXT,
  notes           TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mission_execution_logs IS 'Immutable flight timeline for each mission.';

CREATE INDEX IF NOT EXISTS idx_execution_logs_mission ON public.mission_execution_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created ON public.mission_execution_logs(created_at);

ALTER TABLE public.mission_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "execution_logs_select" ON public.mission_execution_logs;
CREATE POLICY "execution_logs_select" ON public.mission_execution_logs FOR SELECT USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "execution_logs_insert" ON public.mission_execution_logs;
CREATE POLICY "execution_logs_insert" ON public.mission_execution_logs FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Mission Execution Engine schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
