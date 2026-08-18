-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Professional Mission Reporting Engine
-- Migration: 010_mission_reports.sql
-- Sprint 5.2: Auto-generated Mission Reports, PDF Export, Report Management
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MISSION REPORTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_id          UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  report_type         TEXT NOT NULL DEFAULT 'mission_report'
                      CHECK (report_type IN (
                        'mission_report',
                        'aerial_application',
                        'mission_summary',
                        'pilot_flight_report',
                        'aircraft_utilisation',
                        'battery_usage',
                        'weather_summary'
                      )),
  report_number       TEXT NOT NULL,
  filename            TEXT,
  report_data         JSONB NOT NULL DEFAULT '{}',
  generated_by        UUID REFERENCES auth.users(id),
  generated_by_name   TEXT,
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_version      TEXT NOT NULL DEFAULT '1.0',
  status              TEXT NOT NULL DEFAULT 'generated'
                      CHECK (status IN ('generated', 'downloaded', 'printed', 'archived', 'deleted')),

  -- Future placeholders
  customer_signature  TEXT,
  pilot_signature     TEXT,
  digital_certificate TEXT,
  qr_verification     TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mission_reports IS 'Auto-generated professional mission reports linked to completed missions.';
COMMENT ON COLUMN public.mission_reports.report_data IS 'Complete snapshot of mission data at generation time (denormalised for historical accuracy).';
COMMENT ON COLUMN public.mission_reports.report_number IS 'Human-readable report reference number (e.g. RPT-2026-000001).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mission_reports_company ON public.mission_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_mission_reports_mission ON public.mission_reports(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_reports_generated ON public.mission_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_reports_type ON public.mission_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_mission_reports_status ON public.mission_reports(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mission_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_reports_select" ON public.mission_reports;
CREATE POLICY "mission_reports_select" ON public.mission_reports
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "mission_reports_insert" ON public.mission_reports;
CREATE POLICY "mission_reports_insert" ON public.mission_reports
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "mission_reports_update" ON public.mission_reports;
CREATE POLICY "mission_reports_update" ON public.mission_reports
  FOR UPDATE USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "mission_reports_delete" ON public.mission_reports;
CREATE POLICY "mission_reports_delete" ON public.mission_reports
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. REPORT SEQUENCE TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.report_sequences (
  company_id    UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  last_number   INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.report_sequences IS 'Auto-incrementing report number sequence per company.';

ALTER TABLE public.report_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_sequences_select" ON public.report_sequences;
CREATE POLICY "report_sequences_select" ON public.report_sequences
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "report_sequences_upsert" ON public.report_sequences;
CREATE POLICY "report_sequences_upsert" ON public.report_sequences
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "report_sequences_update" ON public.report_sequences;
CREATE POLICY "report_sequences_update" ON public.report_sequences
  FOR UPDATE USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Mission Reports schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
