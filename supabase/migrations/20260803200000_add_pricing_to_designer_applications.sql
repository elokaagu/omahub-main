-- Store pricing preferences from the designer application form
ALTER TABLE public.designer_applications
  ADD COLUMN IF NOT EXISTS price_range TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

COMMENT ON COLUMN public.designer_applications.price_range IS 'Formatted price range or "Explore brand for prices"';
COMMENT ON COLUMN public.designer_applications.currency IS 'ISO currency code for the brand price range';
