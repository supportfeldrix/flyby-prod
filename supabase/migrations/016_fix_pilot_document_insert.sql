-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Fix Pilot Document Insert
-- Migration: 016_fix_pilot_document_insert.sql
-- Fix: RLS blocking inserts into pilot_documents
-- Solution: Use a SECURITY DEFINER function to bypass RLS for inserts
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.insert_pilot_document(
  p_company_id UUID,
  p_pilot_id UUID,
  p_document_type TEXT,
  p_document_name TEXT,
  p_file_name TEXT,
  p_storage_path TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_issue_date DATE DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_uploaded_by UUID DEFAULT NULL,
  p_uploaded_by_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_result JSONB;
  v_id UUID;
BEGIN
  -- Verify the pilot belongs to the company
  IF NOT EXISTS (SELECT 1 FROM public.pilots WHERE id = p_pilot_id AND company_id = p_company_id) THEN
    RETURN jsonb_build_object('error', 'Pilot not found in this company');
  END IF;

  -- Calculate status from expiry date
  IF p_expiry_date IS NULL THEN
    v_status := 'valid';
  ELSIF p_expiry_date < CURRENT_DATE THEN
    v_status := 'expired';
  ELSIF p_expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
    v_status := 'expiring_soon';
  ELSE
    v_status := 'valid';
  END IF;

  -- Delete existing document of same type for this pilot (replace behavior)
  DELETE FROM public.pilot_documents
  WHERE pilot_id = p_pilot_id
    AND document_type = p_document_type
    AND p_document_type != 'other';

  -- Insert
  INSERT INTO public.pilot_documents (
    company_id, pilot_id, document_type, document_name,
    file_name, storage_path, file_size, mime_type,
    issue_date, expiry_date, status, notes,
    uploaded_by, uploaded_by_name
  ) VALUES (
    p_company_id, p_pilot_id, p_document_type, p_document_name,
    p_file_name, p_storage_path, p_file_size, p_mime_type,
    p_issue_date, p_expiry_date, v_status, p_notes,
    p_uploaded_by, p_uploaded_by_name
  )
  RETURNING id INTO v_id;

  -- Return the inserted row as JSON
  SELECT to_jsonb(d) INTO v_result
  FROM public.pilot_documents d
  WHERE d.id = v_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_pilot_document TO authenticated;

COMMENT ON FUNCTION public.insert_pilot_document IS 'Inserts a pilot document with SECURITY DEFINER to bypass RLS. Validates pilot ownership and handles duplicate type replacement.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
