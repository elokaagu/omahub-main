-- Fix favourites table foreign key constraints
-- The previous migration had issues with conditional foreign keys which PostgreSQL doesn't support

-- Drop all existing foreign key constraints on favourites table
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS favorites_brand_id_fkey;
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS favourites_item_id_fkey;
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS favourites_brand_fkey;
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS favourites_catalogue_fkey;
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS favourites_product_fkey;

-- Since PostgreSQL doesn't support conditional foreign keys based on another column,
-- we'll remove foreign key constraints entirely and rely on application-level validation
-- This allows favourites to reference brands, catalogues, and products freely

-- Ensure the table has the correct structure
-- (This should already be done by the previous migration, but let's be safe)
DO $$
BEGIN
    -- Check if item_type column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'favourites' AND column_name = 'item_type') THEN
        ALTER TABLE favourites ADD COLUMN item_type TEXT NOT NULL DEFAULT 'brand'
        CHECK (item_type IN ('brand', 'catalogue', 'product'));
    END IF;
    
    -- Check if item_id column exists (should be renamed from brand_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'favourites' AND column_name = 'item_id') THEN
        -- If brand_id exists, rename it to item_id
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'favourites' AND column_name = 'brand_id') THEN
            ALTER TABLE favourites RENAME COLUMN brand_id TO item_id;
        ELSE
            -- If neither exists, add item_id column
            ALTER TABLE favourites ADD COLUMN item_id TEXT NOT NULL;
        END IF;
    END IF;
END $$;

-- Update existing records to have item_type = 'brand' if they don't already
UPDATE favourites SET item_type = 'brand' WHERE item_type IS NULL;

-- Recreate indexes for better performance
DROP INDEX IF EXISTS favourites_user_id_idx;
DROP INDEX IF EXISTS favourites_item_id_idx;
DROP INDEX IF EXISTS favourites_item_type_idx;

CREATE INDEX favourites_user_id_idx ON favourites(user_id);
CREATE INDEX favourites_item_id_idx ON favourites(item_id);
CREATE INDEX favourites_item_type_idx ON favourites(item_type);

-- Recreate unique constraint
ALTER TABLE favourites DROP CONSTRAINT IF EXISTS unique_favourite;
ALTER TABLE favourites ADD CONSTRAINT unique_favourite UNIQUE (user_id, item_id, item_type);

-- Update RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own favourites" ON favourites;
DROP POLICY IF EXISTS "Users can add their own favourites" ON favourites;
DROP POLICY IF EXISTS "Users can remove their own favourites" ON favourites;
DROP POLICY IF EXISTS "Allow users to read their own favourites" ON favourites;
DROP POLICY IF EXISTS "Allow users to create their own favourites" ON favourites;
DROP POLICY IF EXISTS "Allow users to delete their own favourites" ON favourites;

CREATE POLICY "Users can view their own favourites"
ON favourites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favourites"
ON favourites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favourites"
ON favourites FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 