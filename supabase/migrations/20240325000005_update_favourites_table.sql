-- Drop existing foreign key constraints if they exist
ALTER TABLE favourites
DROP CONSTRAINT IF EXISTS favourites_brand_id_fkey;

-- Rename brand_id column to item_id
ALTER TABLE favourites
RENAME COLUMN brand_id TO item_id;

-- Add item_type column
ALTER TABLE favourites
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'brand'
CHECK (item_type IN ('brand', 'catalogue', 'product'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS favourites_user_id_idx ON favourites(user_id);
CREATE INDEX IF NOT EXISTS favourites_item_id_idx ON favourites(item_id);
CREATE INDEX IF NOT EXISTS favourites_item_type_idx ON favourites(item_type);

-- Add unique constraint to prevent duplicate favourites
ALTER TABLE favourites
ADD CONSTRAINT unique_favourite UNIQUE (user_id, item_id, item_type);

-- Update existing records to have item_type = 'brand'
UPDATE favourites
SET item_type = 'brand'
WHERE item_type IS NULL;

-- Add foreign key constraints for each item type
ALTER TABLE favourites
ADD CONSTRAINT favourites_brand_fkey
FOREIGN KEY (item_id)
REFERENCES brands(id)
ON DELETE CASCADE
WHERE item_type = 'brand';

ALTER TABLE favourites
ADD CONSTRAINT favourites_catalogue_fkey
FOREIGN KEY (item_id)
REFERENCES catalogues(id)
ON DELETE CASCADE
WHERE item_type = 'catalogue';

ALTER TABLE favourites
ADD CONSTRAINT favourites_product_fkey
FOREIGN KEY (item_id)
REFERENCES products(id)
ON DELETE CASCADE
WHERE item_type = 'product';

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own favourites" ON favourites;
DROP POLICY IF EXISTS "Users can add their own favourites" ON favourites;
DROP POLICY IF EXISTS "Users can remove their own favourites" ON favourites;

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