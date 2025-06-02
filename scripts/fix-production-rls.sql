-- Fix RLS policies for production to allow anonymous users to read data
-- This fixes the 401 errors on the production site

-- Fix brands table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.brands;
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public read access to brands" ON public.brands;

-- Create a policy that allows both authenticated and anonymous users to read brands
CREATE POLICY "Public read access to brands"
ON public.brands
FOR SELECT
TO public
USING (true);

-- Fix collections table policies
DROP POLICY IF EXISTS "Allow public read access to collections" ON public.collections;
DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;

-- Create a policy that allows both authenticated and anonymous users to read collections
CREATE POLICY "Public read access to collections"
ON public.collections
FOR SELECT
TO public
USING (true);

-- Fix reviews table policies
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Create a policy that allows both authenticated and anonymous users to read reviews
CREATE POLICY "Public read access to reviews"
ON public.reviews
FOR SELECT
TO public
USING (true);

-- Grant necessary permissions to anonymous users
GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.collections TO anon;
GRANT SELECT ON public.reviews TO anon;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.brands TO authenticated;
GRANT SELECT ON public.collections TO authenticated;
GRANT SELECT ON public.reviews TO authenticated;

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('brands', 'collections', 'reviews')
ORDER BY tablename, policyname; 