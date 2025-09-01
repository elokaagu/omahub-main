-- Fix RLS policies for products table to allow brand admins to edit their products
-- This script should be run in the Supabase SQL Editor

-- First, drop all existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Allow super_admin to delete products" ON public.products;

-- Create new policies with simpler syntax

-- 1. Anyone can view products (public read access)
CREATE POLICY "Anyone can view products" 
  ON public.products FOR SELECT 
  USING (true);

-- 2. Super admins and brand admins can insert products
CREATE POLICY "Authenticated users can insert products" 
  ON public.products FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

-- 3. Super admins can update any product, brand admins can update their own products
CREATE POLICY "Users can update their own products" 
  ON public.products FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'super_admin' 
        OR (
          p.role = 'brand_admin' 
          AND brand_id = ANY(p.owned_brands)
        )
      )
    )
  );

-- 4. Super admins can delete any product, brand admins can delete their own products
CREATE POLICY "Users can delete their own products" 
  ON public.products FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND (
        p.role = 'super_admin' 
        OR (
          p.role = 'brand_admin' 
          AND brand_id = ANY(p.owned_brands)
        )
      )
    )
  );

-- Verify the policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
  AND schemaname = 'public' 
ORDER BY policyname;
