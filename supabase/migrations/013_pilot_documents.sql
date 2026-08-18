-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Pilot Document Management
-- Migration: 013_pilot_documents.sql
-- Sprint 5.3.1: Compliance Documents, Expiry Tracking, Mission Safety Checks
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PILOT DOCUMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pilot_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pilot_id        UUID NOT NULL REFERENCES public.pilots(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL
                  CHECK (document_type IN (
                    'pilot_licence',
                    'medical_certificate',
                    'remote_pilot_licence',
                    'operator_certificate',
                    'training_records',
                    'insurance_certificate',
                    'identity_document',
                    'other'
                  )),
  document_name   TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_size       INTEGER NOT NULL DEFAULT 0,
  mime_type       TEXT NOT NULL,
  issue_date      DATE,
  expiry_date     DATE,
  status          TEXT NOT NULL DEFAULT 'valid'
                  CHECK (status IN ('valid', 'expiring_soon', 'expired', 'not_uploaded')),
  notes           TEXT,
  uploaded_by     UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Future placeholders
  digital_signature TEXT,
  verification_status TEXT,
  verified_by     TEXT,
  verified_at     TIMESTAMPTZ
);

COMMENT ON TABLE public.pilot_documents IS 'Pilot compliance documents with expiry tracking for aviation safety.';
COMMENT ON COLUMN public.pilot_documents.storage_path IS 'Path within the pilot-documents Supabase Storage bucket.';
COMMENT ON COLUMN public.pilot_documents.status IS 'Automatically managed: valid, expiring_soon (<=30 days), expired.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pilot_documents_company ON public.pilot_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_pilot_documents_pilot ON public.pilot_documents(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_documents_type ON public.pilot_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_pilot_documents_expiry ON public.pilot_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pilot_documents_status ON public.pilot_documents(status);

-- Unique constraint: one active document per type per pilot
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_documents_unique_type
  ON public.pilot_documents(pilot_id, document_type)
  WHERE document_type != 'other';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pilot_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pilot_documents_select" ON public.pilot_documents;
CREATE POLICY "pilot_documents_select" ON public.pilot_documents
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilot_documents_insert" ON public.pilot_documents;
CREATE POLICY "pilot_documents_insert" ON public.pilot_documents
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilot_documents_update" ON public.pilot_documents;
CREATE POLICY "pilot_documents_update" ON public.pilot_documents
  FOR UPDATE USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "pilot_documents_delete" ON public.pilot_documents;
CREATE POLICY "pilot_documents_delete" ON public.pilot_documents
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTO-UPDATE STATUS FUNCTION
-- Recalculates document status based on expiry_date.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_pilot_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'valid';
  ELSIF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'valid';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pilot_document_status ON public.pilot_documents;
CREATE TRIGGER trg_pilot_document_status
  BEFORE INSERT OR UPDATE ON public.pilot_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_pilot_document_status();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. COMPLIANCE CHECK FUNCTION
-- Returns whether a pilot's mandatory documents are valid for dispatch.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_pilot_compliance(p_pilot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_docs JSONB;
  v_valid_count INTEGER := 0;
  v_total_mandatory INTEGER := 3;
  v_compliant BOOLEAN := TRUE;
  v_warnings JSONB := '[]'::JSONB;
BEGIN
  -- Check mandatory documents: pilot_licence, medical_certificate, remote_pilot_licence
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', d.document_type,
    'status', d.status,
    'expiry_date', d.expiry_date,
    'days_remaining', CASE WHEN d.expiry_date IS NOT NULL THEN (d.expiry_date - CURRENT_DATE) ELSE NULL END
  )), '[]'::JSONB)
  INTO v_docs
  FROM public.pilot_documents d
  WHERE d.pilot_id = p_pilot_id
    AND d.document_type IN ('pilot_licence', 'medical_certificate', 'remote_pilot_licence');

  -- Count valid mandatory docs
  SELECT COUNT(*)
  INTO v_valid_count
  FROM public.pilot_documents d
  WHERE d.pilot_id = p_pilot_id
    AND d.document_type IN ('pilot_licence', 'medical_certificate', 'remote_pilot_licence')
    AND d.status IN ('valid', 'expiring_soon');

  IF v_valid_count < v_total_mandatory THEN
    v_compliant := FALSE;
  END IF;

  -- Build warnings for expiring/expired docs
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', d.document_type,
    'message', CASE
      WHEN d.status = 'expired' THEN d.document_name || ' has expired'
      WHEN d.status = 'expiring_soon' THEN d.document_name || ' expires in ' || (d.expiry_date - CURRENT_DATE) || ' days'
      ELSE NULL
    END
  )), '[]'::JSONB)
  INTO v_warnings
  FROM public.pilot_documents d
  WHERE d.pilot_id = p_pilot_id
    AND d.status IN ('expired', 'expiring_soon');

  v_result := jsonb_build_object(
    'compliant', v_compliant,
    'valid_count', v_valid_count,
    'total_mandatory', v_total_mandatory,
    'documents', v_docs,
    'warnings', v_warnings
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_pilot_compliance(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Supabase Storage bucket 'pilot-documents' must be created via the
-- Supabase Dashboard or CLI:
--   supabase storage create pilot-documents --public=false
-- Storage path convention: {company_id}/{pilot_id}/{document_type}/{filename}
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Pilot Document Management schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
