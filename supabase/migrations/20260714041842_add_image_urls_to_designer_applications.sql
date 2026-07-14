-- Designer applications now collect 1-3 photos so an approved brand's
-- profile (and its directory card) isn't blank on day one.
ALTER TABLE designer_applications
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::text[];
