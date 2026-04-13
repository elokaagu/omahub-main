-- Atomic booking insert + financial metrics refresh (same transaction).
-- Tighten RLS: brand_admin mutations limited to rows for brands in profiles.owned_brands.

-- ---------------------------------------------------------------------------
-- RPC: single transaction for insert + metrics
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.insert_booking_and_refresh_metrics(
  in_lead_id uuid,
  in_brand_id text,
  in_customer_name text,
  in_customer_email text,
  in_customer_phone text,
  in_booking_type text,
  in_status text,
  in_booking_value numeric,
  in_commission_rate numeric,
  in_commission_amount numeric,
  in_currency text,
  in_booking_date timestamptz,
  in_delivery_date timestamptz,
  in_completion_date timestamptz,
  in_notes text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r public.bookings;
  v_month date;
BEGIN
  INSERT INTO public.bookings (
    lead_id,
    brand_id,
    customer_name,
    customer_email,
    customer_phone,
    booking_type,
    status,
    booking_value,
    commission_rate,
    commission_amount,
    currency,
    booking_date,
    delivery_date,
    completion_date,
    notes
  ) VALUES (
    in_lead_id,
    in_brand_id,
    in_customer_name,
    in_customer_email,
    in_customer_phone,
    in_booking_type,
    COALESCE(NULLIF(trim(in_status), ''), 'confirmed'),
    in_booking_value,
    COALESCE(in_commission_rate, 0),
    COALESCE(in_commission_amount, 0),
    COALESCE(NULLIF(trim(in_currency), ''), 'USD'),
    COALESCE(in_booking_date, now()),
    in_delivery_date,
    in_completion_date,
    in_notes
  )
  RETURNING * INTO r;

  v_month := (date_trunc('month', r.booking_date AT TIME ZONE 'UTC'))::date;
  PERFORM public.update_brand_financial_metrics(r.brand_id::text, v_month);

  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_booking_financial_metrics(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_brand text;
  v_month date;
BEGIN
  SELECT b.brand_id,
         (date_trunc('month', b.booking_date AT TIME ZONE 'UTC'))::date
  INTO v_brand, v_month
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF v_brand IS NOT NULL AND v_month IS NOT NULL THEN
    PERFORM public.update_brand_financial_metrics(v_brand, v_month);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_booking_and_refresh_metrics(
  uuid, text, text, text, text, text, text, numeric, numeric, numeric, text,
  timestamptz, timestamptz, timestamptz, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.refresh_booking_financial_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_booking_financial_metrics(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_booking_and_refresh_metrics(
  uuid, text, text, text, text, text, text, numeric, numeric, numeric, text,
  timestamptz, timestamptz, timestamptz, text
) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS: replace broad "Admins can manage *" with brand-scoped policies
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.leads') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
    DROP POLICY IF EXISTS "Scoped admins insert leads" ON public.leads;
    DROP POLICY IF EXISTS "Scoped admins update leads" ON public.leads;
    DROP POLICY IF EXISTS "Scoped admins delete leads" ON public.leads;

    CREATE POLICY "Scoped admins insert leads"
      ON public.leads FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins update leads"
      ON public.leads FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND leads.brand_id = ANY (p.owned_brands))
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins delete leads"
      ON public.leads FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND leads.brand_id = ANY (p.owned_brands))
          )
        )
      );
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Scoped admins insert bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Scoped admins update bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Scoped admins delete bookings" ON public.bookings;

    CREATE POLICY "Scoped admins insert bookings"
      ON public.bookings FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins update bookings"
      ON public.bookings FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND bookings.brand_id = ANY (p.owned_brands))
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins delete bookings"
      ON public.bookings FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND bookings.brand_id = ANY (p.owned_brands))
          )
        )
      );
  END IF;

  IF to_regclass('public.brand_financial_metrics') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage financial metrics" ON public.brand_financial_metrics;
    DROP POLICY IF EXISTS "Scoped admins insert brand_financial_metrics" ON public.brand_financial_metrics;
    DROP POLICY IF EXISTS "Scoped admins update brand_financial_metrics" ON public.brand_financial_metrics;
    DROP POLICY IF EXISTS "Scoped admins delete brand_financial_metrics" ON public.brand_financial_metrics;

    CREATE POLICY "Scoped admins insert brand_financial_metrics"
      ON public.brand_financial_metrics FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins update brand_financial_metrics"
      ON public.brand_financial_metrics FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_financial_metrics.brand_id = ANY (p.owned_brands))
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins delete brand_financial_metrics"
      ON public.brand_financial_metrics FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND brand_financial_metrics.brand_id = ANY (p.owned_brands))
          )
        )
      );
  END IF;

  IF to_regclass('public.lead_interactions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can view lead interactions" ON public.lead_interactions;
    DROP POLICY IF EXISTS "Admins can manage lead interactions" ON public.lead_interactions;
    DROP POLICY IF EXISTS "Scoped admins select lead_interactions" ON public.lead_interactions;
    DROP POLICY IF EXISTS "Scoped admins insert lead_interactions" ON public.lead_interactions;
    DROP POLICY IF EXISTS "Scoped admins update lead_interactions" ON public.lead_interactions;
    DROP POLICY IF EXISTS "Scoped admins delete lead_interactions" ON public.lead_interactions;

    CREATE POLICY "Scoped admins select lead_interactions"
      ON public.lead_interactions FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          INNER JOIN public.leads l ON l.id = lead_interactions.lead_id
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND l.brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins insert lead_interactions"
      ON public.lead_interactions FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          INNER JOIN public.leads l ON l.id = lead_interactions.lead_id
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND l.brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins update lead_interactions"
      ON public.lead_interactions FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          INNER JOIN public.leads l ON l.id = lead_interactions.lead_id
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND l.brand_id = ANY (p.owned_brands))
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          INNER JOIN public.leads l ON l.id = lead_interactions.lead_id
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND l.brand_id = ANY (p.owned_brands))
          )
        )
      );

    CREATE POLICY "Scoped admins delete lead_interactions"
      ON public.lead_interactions FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          INNER JOIN public.leads l ON l.id = lead_interactions.lead_id
          WHERE p.id = auth.uid()
          AND (
            p.role = 'super_admin'
            OR (p.role = 'brand_admin' AND l.brand_id = ANY (p.owned_brands))
          )
        )
      );
  END IF;
END $$;
