-- Fix: Postgres 42703 — column inquiries.is_read does not exist
-- The Studio inbox API selects is_read / read_at / replied_at on public.inquiries.
-- Run this in the Supabase Dashboard → SQL Editor (production DB), or:
--   supabase db push   (applies supabase/migrations/20260415180000_inquiries_read_columns.sql)
-- Safe to run more than once (IF NOT EXISTS).

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

UPDATE public.inquiries
SET is_read = true
WHERE read_at IS NOT NULL
  AND is_read = false;

UPDATE public.inquiries
SET is_read = true
WHERE status IN ('read', 'replied', 'closed')
  AND is_read = false;

UPDATE public.inquiries
SET replied_at = COALESCE(replied_at, updated_at, created_at)
WHERE status = 'replied'
  AND replied_at IS NULL;
