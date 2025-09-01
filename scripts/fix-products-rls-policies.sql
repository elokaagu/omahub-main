-- Complete rewrite of products RLS policies
-- Run this entire script in Supabase SQL Editor

-- Step 1: Disable RLS temporarily to clear all policies
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Step 2: Re-enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies one by one

-- Policy 1: Anyone can view products
CREATE POLICY "public_select_policy" ON public.products
FOR SELECT USING (true);

-- Policy 2: Super admins can do anything
CREATE POLICY "super_admin_all_policy" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Policy 3: Brand admins can insert products for their brands
CREATE POLICY "brand_admin_insert_policy" ON public.products
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'brand_admin'
  )
);

-- Policy 4: Brand admins can update products for their brands
CREATE POLICY "brand_admin_update_policy" ON public.products
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'brand_admin'
    AND brand_id = ANY(p.owned_brands)
  )
);

-- Policy 5: Brand admins can delete products for their brands
CREATE POLICY "brand_admin_delete_policy" ON public.products
FOR DELETE USING (
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
