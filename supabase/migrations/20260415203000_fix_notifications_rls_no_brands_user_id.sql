-- Fix notifications RLS: policies referenced brands.user_id, which does not exist
-- on public.brands (ownership is profiles.owned_brands). That caused SELECT on
-- public.notifications to fail with PostgreSQL 42703 (undefined_column).

DROP POLICY IF EXISTS "Brand owners can view brand notifications" ON public.notifications;
DROP POLICY IF EXISTS "Brand owners can update brand notifications" ON public.notifications;

CREATE POLICY "Brand owners can view brand notifications" ON public.notifications
  FOR SELECT USING (
    notifications.brand_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'brand_admin'
        AND p.owned_brands IS NOT NULL
        AND notifications.brand_id = ANY (p.owned_brands)
    )
  );

CREATE POLICY "Brand owners can update brand notifications" ON public.notifications
  FOR UPDATE USING (
    notifications.brand_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'brand_admin'
        AND p.owned_brands IS NOT NULL
        AND notifications.brand_id = ANY (p.owned_brands)
    )
  );
