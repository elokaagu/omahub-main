-- Complete rewrite of products RLS policies
-- Brand admins have same rights as super admins, but only for their own products
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop all existing policies explicitly
DROP POLICY IF EXISTS "public_select_policy" ON public.products;
DROP POLICY IF EXISTS "super_admin_all_policy" ON public.products;
DROP POLICY IF EXISTS "brand_admin_own_products_policy" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Allow super_admin to delete products" ON public.products;
DROP POLICY IF EXISTS "brand_admin_insert_policy" ON public.products;
DROP POLICY IF EXISTS "brand_admin_update_policy" ON public.products;
DROP POLICY IF EXISTS "brand_admin_delete_policy" ON public.products;

-- Step 2: Disable and re-enable RLS to ensure clean state
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies

-- Policy 1: Anyone can view products
CREATE POLICY "public_select_policy" ON public.products
FOR SELECT USING (true);

-- Policy 2: Super admins can do anything (full access)
CREATE POLICY "super_admin_all_policy" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Policy 3: Brand admins have full access to their own products (same as super admins)
CREATE POLICY "brand_admin_own_products_policy" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'brand_admin'
    AND brand_id = ANY(p.owned_brands)
  )
);

-- Step 4: Verify the policies
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
  AND schemaname = 'public' 
ORDER BY policyname;
