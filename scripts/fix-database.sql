-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table with correct data types
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  image TEXT NOT NULL,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
  DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
  DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
  
  -- Create fresh policies
  CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);
  
  CREATE POLICY "Authenticated users can insert products" 
    ON public.products FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  
  CREATE POLICY "Users can update their own products" 
    ON public.products FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.brands b 
        WHERE b.id = brand_id
      )
    );
END
$$;

-- Fix storage permissions for buckets table
DO $$
BEGIN
  -- Enable RLS on storage.buckets if not already enabled
  ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for storage.buckets
  DROP POLICY IF EXISTS "Public SELECT policy" ON storage.buckets;
  CREATE POLICY "Public SELECT policy" 
    ON storage.buckets FOR SELECT 
    USING (true);
    
  DROP POLICY IF EXISTS "Admin INSERT/UPDATE/DELETE policy" ON storage.buckets;
  CREATE POLICY "Admin INSERT/UPDATE/DELETE policy" 
    ON storage.buckets FOR ALL 
    TO authenticated 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END
$$;

-- Fix storage permissions for objects table
DO $$
BEGIN
  -- Enable RLS on storage.objects if not already enabled
  ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for storage.objects
  DROP POLICY IF EXISTS "Public SELECT policy for brand-assets" ON storage.objects;
  CREATE POLICY "Public SELECT policy for brand-assets" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'brand-assets');
    
  DROP POLICY IF EXISTS "Auth INSERT policy for brand-assets" ON storage.objects;
  CREATE POLICY "Auth INSERT policy for brand-assets" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');
    
  DROP POLICY IF EXISTS "Public SELECT policy for profiles" ON storage.objects;
  CREATE POLICY "Public SELECT policy for profiles" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'profiles');
    
  DROP POLICY IF EXISTS "Auth INSERT policy for profiles" ON storage.objects;
  CREATE POLICY "Auth INSERT policy for profiles" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');
END
$$;

-- Create buckets if they don't exist (requires superuser privileges)
INSERT INTO storage.buckets (id, name, public)
SELECT 'brand-assets', 'brand-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-assets');

INSERT INTO storage.buckets (id, name, public)
SELECT 'profiles', 'profiles', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profiles');

-- Verify and fix brands table RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create or replace policy for viewing brands
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
CREATE POLICY "Anyone can view brands" 
  ON public.brands FOR SELECT 
  USING (true);

-- Create or replace policy for inserting brands
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
CREATE POLICY "Authenticated users can insert brands" 
  ON public.brands FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create or replace policy for updating brands
DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
CREATE POLICY "Users can update their own brands" 
  ON public.brands FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id); 