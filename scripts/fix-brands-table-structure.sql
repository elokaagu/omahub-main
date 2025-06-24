-- ========================================
-- FIX BRANDS TABLE STRUCTURE
-- Copy and paste this entire script into your Supabase Dashboard > SQL Editor
-- ========================================

-- Step 1: Fix the brands table ID column to auto-generate UUIDs
ALTER TABLE public.brands 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 2: Ensure the brands table has all required columns with proper defaults
-- Add any missing columns that might be required

-- Check if user_id column exists and add it if missing (for RLS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'brands' 
                   AND column_name = 'user_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.brands ADD COLUMN user_id uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Added user_id column to brands table';
    ELSE
        RAISE NOTICE 'user_id column already exists in brands table';
    END IF;
END
$$;

-- Step 3: Update RLS policies to be more permissive for testing
-- Drop existing policies
DROP POLICY IF EXISTS "brands_public_read" ON public.brands;
DROP POLICY IF EXISTS "brands_auth_insert" ON public.brands;
DROP POLICY IF EXISTS "brands_auth_update" ON public.brands;
DROP POLICY IF EXISTS "brands_auth_delete" ON public.brands;

-- Create simple, permissive policies
CREATE POLICY "brands_public_read"
ON public.brands FOR SELECT
TO public
USING (true);

CREATE POLICY "brands_auth_insert"
ON public.brands FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "brands_auth_update"
ON public.brands FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "brands_auth_delete"
ON public.brands FOR DELETE
TO authenticated
USING (true);

-- Step 4: Fix storage bucket MIME types to be more permissive
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/gif',
  'image/svg+xml'
]
WHERE id = 'brand-assets';

-- Step 5: Verify the fixes
SELECT 'Brands Table Structure:' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'brands' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'user_id', 'name', 'description')
ORDER BY ordinal_position;

SELECT 'Brand Assets Bucket MIME Types:' as info;
SELECT id, name, allowed_mime_types
FROM storage.buckets 
WHERE id = 'brand-assets';

SELECT 'Brands Table Policies:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'brands' 
  AND schemaname = 'public'
ORDER BY policyname; 