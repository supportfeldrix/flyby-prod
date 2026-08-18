-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Fix Mission Number Generation (Concurrency-Safe)
-- Migration: 011_fix_mission_number_generation.sql
-- Bug Fix: duplicate key value violates unique constraint "idx_missions_number_company"
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ATOMIC NEXT MISSION NUMBER FUNCTION
--
-- Uses INSERT ... ON CONFLICT with an atomic UPDATE + RETURNING to guarantee
-- no two concurrent callers ever receive the same number.
--
-- This handles:
--   • First mission ever (inserts row with last_number = 1)
--   • Normal increment (atomically increments and returns new value)
--   • Concurrent calls (serialised by the row-level lock from UPDATE)
--   • Deleted missions (sequence never goes backwards)
--   • Imported data (caller can seed last_number higher if needed)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.next_mission_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM now())::TEXT;

  -- Atomic upsert: insert if not exists, otherwise increment.
  -- The ON CONFLICT ... DO UPDATE acquires a row-level lock, preventing races.
  INSERT INTO public.mission_sequences (company_id, last_number)
  VALUES (p_company_id, 1)
  ON CONFLICT (company_id)
  DO UPDATE SET last_number = public.mission_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'FLY-' || v_year || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$;

COMMENT ON FUNCTION public.next_mission_number(UUID) IS
  'Atomically generates the next mission number for a company. Concurrency-safe via row-level locking.';

-- Grant execute to authenticated users (RLS on mission_sequences still applies for direct table access)
GRANT EXECUTE ON FUNCTION public.next_mission_number(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED EXISTING SEQUENCES TO MATCH ACTUAL MISSION COUNT
--
-- If missions were already created with the broken logic, the sequence counter
-- may be out of sync. This brings it up to the actual maximum mission number
-- that exists per company.
-- ─────────────────────────────────────────────────────────────────────────────

-- Update mission_sequences.last_number to at least match the highest existing
-- mission number for each company (extracts the numeric suffix from FLY-YYYY-NNNNNN)
UPDATE public.mission_sequences ms
SET last_number = sub.max_num
FROM (
  SELECT
    company_id,
    MAX(
      CASE
        WHEN mission_number ~ '^FLY-[0-9]{4}-[0-9]+$'
        THEN CAST(SPLIT_PART(mission_number, '-', 3) AS INTEGER)
        ELSE 0
      END
    ) AS max_num
  FROM public.missions
  GROUP BY company_id
) sub
WHERE ms.company_id = sub.company_id
  AND sub.max_num > ms.last_number;

-- Also insert sequence rows for companies that have missions but no sequence entry yet
INSERT INTO public.mission_sequences (company_id, last_number)
SELECT
  m.company_id,
  MAX(
    CASE
      WHEN m.mission_number ~ '^FLY-[0-9]{4}-[0-9]+$'
      THEN CAST(SPLIT_PART(m.mission_number, '-', 3) AS INTEGER)
      ELSE 0
    END
  )
FROM public.missions m
WHERE NOT EXISTS (
  SELECT 1 FROM public.mission_sequences ms WHERE ms.company_id = m.company_id
)
GROUP BY m.company_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Mission number generation is now concurrency-safe.
-- ═══════════════════════════════════════════════════════════════════════════════
