-- First, let's get a brand ID to assign to our test user
WITH sample_brand AS (
  SELECT id FROM brands LIMIT 1
)
UPDATE profiles
SET 
  role = 'brand_owner',
  owned_brands = ARRAY[(SELECT id FROM sample_brand)]::uuid[]
WHERE id = auth.uid()
RETURNING *; 