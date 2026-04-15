-- Unique URL slug for products (studio + future public routes)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill: slugify(title) + id fragment so every row is unique in one pass
UPDATE public.products
SET slug = concat(
  COALESCE(
    NULLIF(
      trim(
        both '-'
        FROM regexp_replace(
          lower(
            regexp_replace(coalesce(trim(title), ''), '[^a-zA-Z0-9]+', '-', 'g')
          ),
          '-+',
          '-',
          'g'
        )
      ),
      ''
    ),
    'product'
  ),
  '-',
  substring(replace(id::text, '-', '') FROM 1 FOR 12)
)
WHERE slug IS NULL;

ALTER TABLE public.products
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);

COMMENT ON COLUMN public.products.slug IS 'URL-safe unique slug for product links';
