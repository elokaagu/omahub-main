-- Simple, bulletproof RLS policies for products
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop all existing policies
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

-- Step 2: Disable and re-enable RLS
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple policies

-- Anyone can view products
CREATE POLICY "view_products" ON public.products
FOR SELECT USING (true);

-- Super admins can do everything
CREATE POLICY "super_admin_access" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Brand admins can do everything on their own products
CREATE POLICY "brand_admin_access" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'brand_admin'
    AND brand_id = ANY(p.owned_brands)
  )
);

-- Verify the policies
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'products' AND schemaname = 'public' 
ORDER BY policyname;
