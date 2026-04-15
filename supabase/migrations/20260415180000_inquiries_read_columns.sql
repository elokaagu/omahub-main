-- Align public.inquiries with Studio inbox API (/api/studio/inbox/*) which expects
-- is_read, replied_at (and optionally read_at from older inbox scripts).
-- Fixes Postgres 42703 undefined_column when the table was created from a minimal script.

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Backfill is_read from timestamp or status conventions used in older schemas
UPDATE public.inquiries
SET is_read = true
WHERE read_at IS NOT NULL
  AND is_read = false;

UPDATE public.inquiries
SET is_read = true
WHERE status IN ('read', 'replied', 'closed')
  AND is_read = false;

-- If status already implies "replied" but replied_at was never set
UPDATE public.inquiries
SET replied_at = COALESCE(replied_at, updated_at, created_at)
WHERE status = 'replied'
  AND replied_at IS NULL;
