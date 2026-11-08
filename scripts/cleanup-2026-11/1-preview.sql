-- =============================================================================
-- OmaHub data cleanup, November 2026 - STEP 1: PREVIEW (read-only)
--
-- Run this in the Supabase SQL editor first. It changes nothing; it returns one
-- table showing exactly what 2-apply.sql will delete, move or merge, plus any
-- other test leftovers it can find. Read it before running step 2.
--
-- What the cleanup covers:
--   A. Test data from a functional test run on 2026-10-03: catalogues titled
--      "Func Catalogue..." / "Probe Coll..." and tailors titled "Func Tailor...",
--      all on the Gbemi brand with https://example.com/ images.
--   B. Duplicate brands:
--        YVK Design   e1aafaeb-...  (empty)        -> merge into 860f3268-...
--        Ebhs Couture ebhs-couture  (typo seed)    -> merge into ehbs-couture
-- =============================================================================

DROP TABLE IF EXISTS pg_temp.cleanup_report;
CREATE TEMP TABLE cleanup_report (
  step    int,
  section text,
  item    text,
  rows    bigint,
  detail  text
);

DO $$
DECLARE
  gbemi constant text := '81f2d903-6e26-4875-84c9-a64cc15b0c54';
  r record;
  p record;
  n bigint;
BEGIN
  ---------------------------------------------------------------------------
  -- A. Test catalogues and tailors
  ---------------------------------------------------------------------------
  INSERT INTO cleanup_report
  SELECT 1, 'A. test data', 'catalogues to delete (expect 36)', count(*),
         string_agg(DISTINCT image, ', ')
  FROM public.catalogues
  WHERE brand_id::text = gbemi
    AND image ILIKE 'https://example.com/%'
    AND (title ILIKE 'Func Catalogue%' OR title ILIKE 'Probe Coll%');

  INSERT INTO cleanup_report
  SELECT 1, 'A. test data', 'tailors to delete (expect 13)', count(*),
         string_agg(DISTINCT image, ', ')
  FROM public.tailors
  WHERE brand_id::text = gbemi
    AND image ILIKE 'https://example.com/%'
    AND title ILIKE 'Func Tailor%';

  INSERT INTO cleanup_report
  SELECT 1, 'A. test data', 'Gbemi rows that STAY (real data)', count(*),
         string_agg(title, ', ')
  FROM (
    SELECT title FROM public.catalogues
    WHERE brand_id::text = gbemi AND image NOT ILIKE 'https://example.com/%'
    UNION ALL
    SELECT title FROM public.products WHERE brand_id::text = gbemi
  ) keep;

  -- Anything else that points at the test catalogues / tailors.
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.column_name IN ('catalogue_id', 'collection_id', 'tailor_id')
      AND c.table_name NOT IN ('catalogues', 'tailors')
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I::text IN (
         SELECT id::text FROM public.catalogues
           WHERE brand_id::text = $1 AND image ILIKE ''https://example.com/%%''
         UNION ALL
         SELECT id::text FROM public.tailors
           WHERE brand_id::text = $1 AND image ILIKE ''https://example.com/%%'')',
      r.table_name, r.column_name)
    INTO n USING gbemi;
    IF n > 0 THEN
      INSERT INTO cleanup_report VALUES
        (1, 'A. test data', format('rows in %s.%s linked to test rows', r.table_name, r.column_name), n,
         CASE WHEN r.table_name = 'products'
              THEN 'BLOCKS step 2: move these products to a real catalogue first'
              ELSE 'will be deleted with the test rows' END);
    END IF;
  END LOOP;

  ---------------------------------------------------------------------------
  -- B. Duplicate brands: what will move to the brand being kept
  ---------------------------------------------------------------------------
  FOR p IN
    SELECT * FROM (VALUES
      ('e1aafaeb-d515-438c-91ce-c8ad49d84c42', '860f3268-665c-4df3-929f-5589c5ae90bb', 'YVK Design'),
      ('ebhs-couture', 'ehbs-couture', 'Ebhs -> Ehbs Couture')
    ) v(drop_id, keep_id, label)
  LOOP
    INSERT INTO cleanup_report
    SELECT 2, 'B. ' || p.label, 'brand to remove: ' || p.drop_id, count(*),
           max(name) FROM public.brands WHERE id::text = p.drop_id;
    INSERT INTO cleanup_report
    SELECT 2, 'B. ' || p.label, 'brand to keep: ' || p.keep_id, count(*),
           max(name) FROM public.brands WHERE id::text = p.keep_id;

    FOR r IN
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        AND c.column_name = 'brand_id' AND c.table_name <> 'brands'
    LOOP
      EXECUTE format('SELECT count(*) FROM public.%I WHERE brand_id::text = $1', r.table_name)
      INTO n USING p.drop_id;
      IF n > 0 THEN
        INSERT INTO cleanup_report VALUES
          (2, 'B. ' || p.label, format('%s rows to move', r.table_name), n, 'moved to ' || p.keep_id);
      END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'favourites' AND column_name = 'item_id') THEN
      EXECUTE 'SELECT count(*) FROM public.favourites WHERE item_id::text = $1' INTO n USING p.drop_id;
      IF n > 0 THEN
        INSERT INTO cleanup_report VALUES (2, 'B. ' || p.label, 'favourites to move', n, 'moved to ' || p.keep_id);
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'owned_brands') THEN
      EXECUTE 'SELECT count(*) FROM public.profiles WHERE $1 = ANY(owned_brands)' INTO n USING p.drop_id;
      IF n > 0 THEN
        INSERT INTO cleanup_report VALUES (2, 'B. ' || p.label, 'brand owners to update', n, 'owned_brands switched to ' || p.keep_id);
      END IF;
    END IF;
  END LOOP;

  ---------------------------------------------------------------------------
  -- C. Other possible test leftovers (report only; step 2 does NOT touch these)
  ---------------------------------------------------------------------------
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying')
      AND (c.column_name ILIKE '%email%'
           OR c.column_name IN ('title', 'name', 'description', 'customer_name', 'brand_name'))
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I ILIKE ''%%@example.com''
         OR %I ILIKE ''Func %%'' OR %I ILIKE ''Func-%%'' OR %I ILIKE ''Probe %%''
         OR %I ILIKE ''%%functional test%%''',
      r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name)
    INTO n;
    IF n > 0 AND NOT (r.table_name IN ('catalogues', 'tailors')) THEN
      INSERT INTO cleanup_report VALUES
        (3, 'C. other leftovers (not deleted)', format('%s.%s', r.table_name, r.column_name), n,
         'matches @example.com / Func / Probe / "functional test"');
    END IF;
  END LOOP;

  SELECT count(*) INTO n FROM auth.users WHERE email ILIKE '%@example.com';
  IF n > 0 THEN
    INSERT INTO cleanup_report VALUES
      (3, 'C. other leftovers (not deleted)', 'auth.users with @example.com emails', n,
       'review in Authentication > Users');
  END IF;
END $$;

SELECT section, item, rows, detail
FROM cleanup_report
ORDER BY step, section, item;
