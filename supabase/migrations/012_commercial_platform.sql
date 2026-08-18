-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Commercial Operations Platform
-- Migration: 012_commercial_platform.sql
-- Sprint 5.3: Invoicing, Payments, Profitability, Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COMMERCIAL SETTINGS (per-company configuration)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commercial_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  currency          TEXT NOT NULL DEFAULT 'ZAR',
  currency_symbol   TEXT NOT NULL DEFAULT 'R',
  vat_percentage    NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  vat_registered    BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_prefix    TEXT NOT NULL DEFAULT 'INV',
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  default_mission_rate NUMERIC(12,2) DEFAULT 0,
  rate_per_hectare  NUMERIC(12,2) DEFAULT 0,
  bank_name         TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch_code  TEXT,
  bank_reference    TEXT,
  invoice_notes     TEXT,
  invoice_footer    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commercial_settings IS 'Per-company commercial configuration: currency, VAT, rates, banking.';

ALTER TABLE public.commercial_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commercial_settings_all" ON public.commercial_settings;
CREATE POLICY "commercial_settings_all" ON public.commercial_settings FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INVOICE SEQUENCES (per-company auto-increment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  company_id  UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.invoice_sequences IS 'Per-company auto-increment counter for invoice numbers.';

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_sequences_all" ON public.invoice_sequences;
CREATE POLICY "invoice_sequences_all" ON public.invoice_sequences FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- Atomic invoice number generation function
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
  v_prefix TEXT;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM now())::TEXT;

  -- Get custom prefix or use default
  SELECT COALESCE(invoice_prefix, 'INV')
  INTO v_prefix
  FROM public.commercial_settings
  WHERE company_id = p_company_id;

  IF v_prefix IS NULL THEN
    v_prefix := 'INV';
  END IF;

  -- Atomic upsert with row-level lock
  INSERT INTO public.invoice_sequences (company_id, last_number)
  VALUES (p_company_id, 1)
  ON CONFLICT (company_id)
  DO UPDATE SET last_number = public.invoice_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_invoice_number(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INVOICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  mission_id      UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  customer_id     UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  farm_id         UUID REFERENCES public.farms(id) ON DELETE SET NULL,

  -- Amounts
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due     NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Status
  status          TEXT NOT NULL DEFAULT 'Draft'
                  CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Paid', 'Overdue', 'Cancelled', 'Partial')),

  -- Dates
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  paid_date       DATE,

  -- Details
  description     TEXT,
  notes           TEXT,
  footer          TEXT,
  payment_terms   TEXT,
  vat_percentage  NUMERIC(5,2) DEFAULT 15.00,
  currency        TEXT DEFAULT 'ZAR',

  -- Meta
  created_by      UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Future placeholders
  sent_at         TIMESTAMPTZ,
  viewed_at       TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  CONSTRAINT idx_invoices_number_company UNIQUE (company_id, invoice_number)
);

COMMENT ON TABLE public.invoices IS 'Customer invoices linked to missions.';

CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_mission ON public.invoices(mission_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INVOICE ITEMS (line items)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit            TEXT DEFAULT 'ha',
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.invoice_items IS 'Line items for each invoice.';

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_items_all" ON public.invoice_items;
CREATE POLICY "invoice_items_all" ON public.invoice_items FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'EFT'
                  CHECK (payment_method IN ('EFT', 'Cash', 'Card', 'Cheque', 'Other')),
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  reference       TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'Paid'
                  CHECK (status IN ('Pending', 'Paid', 'Partial', 'Cancelled', 'Refunded')),
  created_by      UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Payment records against invoices.';

CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "payments_update" ON public.payments;
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "payments_delete" ON public.payments;
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MISSION COSTS (cost breakdown per mission)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_id      UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  chemical_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
  pilot_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
  aircraft_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
  battery_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
  travel_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,
  maintenance_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT idx_mission_costs_unique UNIQUE (company_id, mission_id)
);

COMMENT ON TABLE public.mission_costs IS 'Cost breakdown for each mission used in profitability calculations.';

CREATE INDEX IF NOT EXISTS idx_mission_costs_company ON public.mission_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_mission_costs_mission ON public.mission_costs(mission_id);

ALTER TABLE public.mission_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_costs_all" ON public.mission_costs;
CREATE POLICY "mission_costs_all" ON public.mission_costs FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. MISSION PROFIT VIEW (calculated from invoices and costs)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.mission_profit AS
SELECT
  m.id AS mission_id,
  m.company_id,
  m.mission_number,
  m.status AS mission_status,
  m.scheduled_date,
  m.actual_area,
  m.actual_duration,
  m.customer_id,
  c.customer_name,
  m.pilot_id,
  m.aircraft_id,
  COALESCE(i.total_amount, 0) AS revenue,
  COALESCE(mc.total_cost, 0) AS total_cost,
  COALESCE(i.total_amount, 0) - COALESCE(mc.total_cost, 0) AS net_profit,
  CASE
    WHEN COALESCE(i.total_amount, 0) > 0
    THEN ROUND(((COALESCE(i.total_amount, 0) - COALESCE(mc.total_cost, 0)) / i.total_amount) * 100, 1)
    ELSE 0
  END AS profit_margin_pct,
  mc.chemical_cost,
  mc.pilot_cost,
  mc.aircraft_cost,
  mc.battery_cost,
  mc.travel_cost,
  mc.maintenance_cost,
  mc.other_cost
FROM public.missions m
LEFT JOIN public.customers c ON c.id = m.customer_id
LEFT JOIN public.invoices i ON i.mission_id = m.id AND i.status != 'Cancelled'
LEFT JOIN public.mission_costs mc ON mc.mission_id = m.id
WHERE m.status = 'Completed';

COMMENT ON VIEW public.mission_profit IS 'Calculated profitability for each completed mission.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Commercial Operations Platform schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
