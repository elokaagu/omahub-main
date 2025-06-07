-- Alternative Migration: Convert foreign key columns to TEXT to match catalogues.id
-- This migration converts catalogue_id columns from UUID to TEXT to match catalogues.id

-- Step 1: Drop the foreign key constraints temporarily
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_catalogue_id_fkey;
ALTER TABLE catalogue_images DROP CONSTRAINT IF EXISTS catalogue_images_catalogue_id_fkey;

-- Step 2: Convert catalogue_id columns from UUID to TEXT
ALTER TABLE products ALTER COLUMN catalogue_id TYPE TEXT USING catalogue_id::TEXT;
ALTER TABLE catalogue_images ALTER COLUMN catalogue_id TYPE TEXT USING catalogue_id::TEXT;

-- Step 3: Re-add the foreign key constraints with matching TEXT types
ALTER TABLE products ADD CONSTRAINT products_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE SET NULL;

ALTER TABLE catalogue_images ADD CONSTRAINT catalogue_images_catalogue_id_fkey 
    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id) ON DELETE CASCADE; 