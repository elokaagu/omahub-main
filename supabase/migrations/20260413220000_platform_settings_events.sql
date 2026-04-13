-- Audit trail for platform_settings changes (e.g. visibility). Optional for API: inserts are best-effort.

CREATE TABLE IF NOT EXISTS public.platform_settings_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  previous_value text,
  new_value text,
  action text NOT NULL,
  actor_id uuid NOT NULL,
  changed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_events_created_at
  ON public.platform_settings_events (created_at DESC);

ALTER TABLE public.platform_settings_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_events_insert_super_admin" ON public.platform_settings_events;
DROP POLICY IF EXISTS "platform_settings_events_select_super_admin" ON public.platform_settings_events;

CREATE POLICY "platform_settings_events_insert_super_admin"
  ON public.platform_settings_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "platform_settings_events_select_super_admin"
  ON public.platform_settings_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

COMMENT ON TABLE public.platform_settings_events IS
  'Append-only audit log for sensitive platform_settings mutations; written by app when table exists.';
