-- =============================================================================
-- OmaHub data cleanup, November 2026 - STEP 2: APPLY
--
-- Run 1-preview.sql first and check its output.
--
-- Runs as one transaction. It checks the expected counts before changing
-- anything; if any check fails it stops with an error and NOTHING is changed.
--
--   A. Deletes 36 test catalogues and 13 test tailors on the Gbemi brand
--      (and any rows that only exist to point at them, e.g. their images).
--   B. Merges duplicate brands into the one with real content:
--        YVK Design   e1aafaeb-...  -> 860f3268-...
--        Ebhs Couture ebhs-couture  -> ehbs-couture
--      Every row pointing at the duplicate (products, catalogues, images,
--      reviews, leads, favourites, owners...) is moved to the kept brand
--      first; a row that would clash with one the kept brand already has is
--      dropped as a duplicate. Then the duplicate brand is deleted.
--
-- The last result shows what's left so you can confirm it worked. If a check
-- failed, the transaction is rolled back and the result shows the old data.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  gbemi constant text := '81f2d903-6e26-4875-84c9-a64cc15b0c54';
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  n bigint;
  r record;
  p record;
  c record;
BEGIN
  ---------------------------------------------------------------------------
  -- A. Test data
  ---------------------------------------------------------------------------
  CREATE TEMP TABLE _test_catalogues ON COMMIT DROP AS
    SELECT id::text AS id FROM public.catalogues
    WHERE brand_id::text = gbemi
      AND image ILIKE 'https://example.com/%'
      AND (title ILIKE 'Func Catalogue%' OR title ILIKE 'Probe Coll%');

  CREATE TEMP TABLE _test_tailors ON COMMIT DROP AS
    SELECT id::text AS id FROM public.tailors
    WHERE brand_id::text = gbemi
      AND image ILIKE 'https://example.com/%'
      AND title ILIKE 'Func Tailor%';

  SELECT count(*) INTO n FROM _test_catalogues;
  IF n <> 36 THEN
    RAISE EXCEPTION 'Expected 36 test catalogues, found %. Nothing was changed.', n;
  END IF;
  SELECT count(*) INTO n FROM _test_tailors;
  IF n <> 13 THEN
    RAISE EXCEPTION 'Expected 13 test tailors, found %. Nothing was changed.', n;
  END IF;

  -- Never delete a real product: stop if one sits in a test catalogue.
  SELECT count(*) INTO n FROM public.products
  WHERE catalogue_id::text IN (SELECT id FROM _test_catalogues);
  IF n > 0 THEN
    RAISE EXCEPTION '% product(s) are in a test catalogue. Move them first. Nothing was changed.', n;
  END IF;

  -- Remove rows that only point at the test catalogues / tailors.
  FOR r IN
    SELECT c2.table_name, c2.column_name
    FROM information_schema.columns c2
    JOIN information_schema.tables t
      ON t.table_schema = c2.table_schema AND t.table_name = c2.table_name
    WHERE c2.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c2.column_name IN ('catalogue_id', 'collection_id', 'tailor_id')
      AND c2.table_name NOT IN ('catalogues', 'tailors', 'products')
  LOOP
    EXECUTE format(
      'DELETE FROM public.%I WHERE %I::text IN (SELECT id FROM _test_catalogues UNION ALL SELECT id FROM _test_tailors)',
      r.table_name, r.column_name);
  END LOOP;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'favourites' AND column_name = 'item_id') THEN
    EXECUTE 'DELETE FROM public.favourites WHERE item_id::text IN
             (SELECT id FROM _test_catalogues UNION ALL SELECT id FROM _test_tailors)';
  END IF;

  DELETE FROM public.tailors    WHERE id::text IN (SELECT id FROM _test_tailors);
  DELETE FROM public.catalogues WHERE id::text IN (SELECT id FROM _test_catalogues);

  ---------------------------------------------------------------------------
  -- B. Merge duplicate brands
  ---------------------------------------------------------------------------
  FOR p IN
    SELECT * FROM (VALUES
      ('e1aafaeb-d515-438c-91ce-c8ad49d84c42', '860f3268-665c-4df3-929f-5589c5ae90bb'),
      ('ebhs-couture', 'ehbs-couture')
    ) v(drop_id, keep_id)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id::text = p.keep_id) THEN
      RAISE EXCEPTION 'Brand to keep (%) not found. Nothing was changed.', p.keep_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id::text = p.drop_id) THEN
      RAISE NOTICE 'Duplicate % already gone, skipping.', p.drop_id;
      CONTINUE;
    END IF;

    -- Keep the kept brand's own images: drop the duplicate's image for any
    -- role (cover, logo...) the kept brand already has.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'brand_images' AND column_name = 'role') THEN
      EXECUTE 'DELETE FROM public.brand_images d
               WHERE d.brand_id::text = $1
                 AND EXISTS (SELECT 1 FROM public.brand_images k
                             WHERE k.brand_id::text = $2 AND k.role = d.role)'
      USING p.drop_id, p.keep_id;
    END IF;

    -- Move every row with a brand_id pointing at the duplicate.
    FOR r IN
      SELECT c2.table_name, c2.data_type
      FROM information_schema.columns c2
      JOIN information_schema.tables t
        ON t.table_schema = c2.table_schema AND t.table_name = c2.table_name
      WHERE c2.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        AND c2.column_name = 'brand_id' AND c2.table_name <> 'brands'
    LOOP
      -- A uuid column can't hold a slug id like 'ebhs-couture', so skip it.
      CONTINUE WHEN r.data_type = 'uuid' AND (p.keep_id !~ uuid_re OR p.drop_id !~ uuid_re);
      BEGIN
        EXECUTE format('UPDATE public.%I SET brand_id = %L WHERE brand_id::text = %L',
                       r.table_name, p.keep_id, p.drop_id);
      EXCEPTION WHEN unique_violation THEN
        -- Move row by row; a row the kept brand already has is a duplicate.
        FOR c IN EXECUTE format('SELECT ctid FROM public.%I WHERE brand_id::text = %L',
                                r.table_name, p.drop_id)
        LOOP
          BEGIN
            EXECUTE format('UPDATE public.%I SET brand_id = %L WHERE ctid = %L',
                           r.table_name, p.keep_id, c.ctid);
          EXCEPTION WHEN unique_violation THEN
            EXECUTE format('DELETE FROM public.%I WHERE ctid = %L', r.table_name, c.ctid);
          END;
        END LOOP;
      END;
    END LOOP;

    -- Favourites of the duplicate brand.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'favourites' AND column_name = 'item_id') THEN
      FOR c IN EXECUTE 'SELECT ctid FROM public.favourites WHERE item_id::text = $1' USING p.drop_id
      LOOP
        BEGIN
          EXECUTE 'UPDATE public.favourites SET item_id = $1 WHERE ctid = $2' USING p.keep_id, c.ctid;
        EXCEPTION WHEN unique_violation OR invalid_text_representation THEN
          EXECUTE 'DELETE FROM public.favourites WHERE ctid = $1' USING c.ctid;
        END;
      END LOOP;
    END IF;

    -- Brand owners.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'owned_brands') THEN
      EXECUTE 'UPDATE public.profiles
               SET owned_brands = ARRAY(SELECT DISTINCT x FROM unnest(array_replace(owned_brands, $1, $2)) x)
               WHERE $1 = ANY(owned_brands)'
      USING p.drop_id, p.keep_id;
    END IF;

    DELETE FROM public.brands WHERE id::text = p.drop_id;
  END LOOP;
END $$;

COMMIT;

-- What's left (expect 0 test rows, one YVK Design, one Ehbs Couture).
SELECT 'test catalogues left' AS check, count(*)::text AS result
  FROM public.catalogues WHERE image ILIKE 'https://example.com/%'
UNION ALL
SELECT 'test tailors left', count(*)::text
  FROM public.tailors WHERE image ILIKE 'https://example.com/%'
UNION ALL
SELECT 'YVK Design brands', string_agg(id::text, ', ')
  FROM public.brands WHERE name ILIKE 'YVK%'
UNION ALL
SELECT 'E?bs Couture brands', string_agg(id::text || ' (' || name || ')', ', ')
  FROM public.brands WHERE name ILIKE 'E_bs Couture'
UNION ALL
SELECT 'Ehbs Couture catalogues', string_agg(title, ', ')
  FROM public.catalogues WHERE brand_id::text = 'ehbs-couture';
