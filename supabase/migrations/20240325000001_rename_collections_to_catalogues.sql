-- Migration: Rename collections to catalogues
-- This migration renames the collections table and related references to catalogues

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to collections" ON collections;
DROP POLICY IF EXISTS "Allow API to create collections" ON collections;
DROP POLICY IF EXISTS "Allow API to update collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to create collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to update collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to delete collections" ON collections;

-- Step 2: Drop foreign key constraint from products table
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_collection_id_fkey;

-- Step 3: Rename collections table to catalogues
ALTER TABLE collections RENAME TO catalogues;

-- Step 4: Rename collection_images table to catalogue_images
ALTER TABLE collection_images RENAME TO catalogue_images;

-- Step 5: Rename collection_id column in catalogue_images table
ALTER TABLE catalogue_images RENAME COLUMN collection_id TO catalogue_id;

-- Step 6: Rename collection_id column in products table
ALTER TABLE products RENAME COLUMN collection_id TO catalogue_id;

-- Step 7: Add foreign key constraint back with new names
ALTER TABLE products ADD CONSTRAINT products_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE SET NULL;

-- Step 8: Add foreign key constraint for catalogue_images
ALTER TABLE catalogue_images ADD CONSTRAINT catalogue_images_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE CASCADE;

-- Step 9: Create new RLS policies for catalogues
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

-- Step 10: Create RLS policies for catalogue_images
CREATE POLICY "Allow public read access to catalogue_images"
ON catalogue_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow API to create catalogue_images"
ON catalogue_images FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow API to update catalogue_images"
ON catalogue_images FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow API to delete catalogue_images"
ON catalogue_images FOR DELETE
TO public
USING (true);

-- Step 11: Update any stored procedures or functions (if they exist)
-- Note: Add any custom functions that reference collections here

-- Step 12: Update any views (if they exist)
-- Note: Add any views that reference collections here

-- Verification queries (commented out for production)
-- SELECT COUNT(*) as catalogue_count FROM catalogues;
-- SELECT COUNT(*) as catalogue_images_count FROM catalogue_images;
-- SELECT COUNT(*) as products_with_catalogues FROM products WHERE catalogue_id IS NOT NULL; 