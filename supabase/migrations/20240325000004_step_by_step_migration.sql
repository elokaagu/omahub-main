-- Step-by-step migration: Collections to Catalogues
-- This migration safely converts collections to catalogues with proper type handling

-- First, let's check what exists and handle it step by step

-- Step 1: Drop any existing foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_collection_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_catalogue_id_fkey;

-- Step 2: Drop existing policies on collections (if they exist)
DROP POLICY IF EXISTS "Allow public read access to collections" ON collections;
DROP POLICY IF EXISTS "Allow API to create collections" ON collections;
DROP POLICY IF EXISTS "Allow API to update collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to create collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to update collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to delete collections" ON collections;

-- Step 3: Rename collections table to catalogues (if collections exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collections') THEN
        ALTER TABLE collections RENAME TO catalogues;
    END IF;
END $$;

-- Step 4: Handle collection_images table
DO $$
BEGIN
    -- Drop constraints on collection_images if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collection_images') THEN
        ALTER TABLE collection_images DROP CONSTRAINT IF EXISTS collection_images_collection_id_fkey;
        -- Rename table
        ALTER TABLE collection_images RENAME TO catalogue_images;
        -- Rename column
        ALTER TABLE catalogue_images RENAME COLUMN collection_id TO catalogue_id;
    END IF;
END $$;

-- Step 5: Handle products table column rename
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'collection_id') THEN
        ALTER TABLE products RENAME COLUMN collection_id TO catalogue_id;
    END IF;
END $$;

-- Step 6: Fix type compatibility - convert catalogue_id columns to TEXT to match catalogues.id
DO $$
BEGIN
    -- Convert products.catalogue_id to TEXT if it's UUID
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'catalogue_id' AND data_type = 'uuid') THEN
        ALTER TABLE products ALTER COLUMN catalogue_id TYPE TEXT USING catalogue_id::TEXT;
    END IF;
    
    -- Convert catalogue_images.catalogue_id to TEXT if it's UUID and table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'catalogue_images') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'catalogue_images' AND column_name = 'catalogue_id' AND data_type = 'uuid') THEN
            ALTER TABLE catalogue_images ALTER COLUMN catalogue_id TYPE TEXT USING catalogue_id::TEXT;
        END IF;
    END IF;
END $$;

-- Step 7: Add foreign key constraints back with proper types
ALTER TABLE products ADD CONSTRAINT products_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE SET NULL;

-- Add catalogue_images constraint only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'catalogue_images') THEN
        ALTER TABLE catalogue_images ADD CONSTRAINT catalogue_images_catalogue_id_fkey 
            FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 8: Create RLS policies for catalogues
CREATE POLICY "Allow public read access to catalogues"
ON catalogues FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow API to create catalogues"
ON catalogues FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow API to update catalogues"
ON catalogues FOR UPDATE
TO public
USING (true);

-- Step 9: Create RLS policies for catalogue_images (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'catalogue_images') THEN
        EXECUTE 'CREATE POLICY "Allow public read access to catalogue_images" ON catalogue_images FOR SELECT TO public USING (true)';
        EXECUTE 'CREATE POLICY "Allow API to create catalogue_images" ON catalogue_images FOR INSERT TO public WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Allow API to update catalogue_images" ON catalogue_images FOR UPDATE TO public USING (true)';
        EXECUTE 'CREATE POLICY "Allow API to delete catalogue_images" ON catalogue_images FOR DELETE TO public USING (true)';
    END IF;
END $$; 