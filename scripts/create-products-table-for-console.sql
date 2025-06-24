-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table if it doesn't exist
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

-- Enable row level security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Anyone can view products'
  ) THEN
    CREATE POLICY "Anyone can view products" ON public.products
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Authenticated users can insert products'
  ) THEN
    CREATE POLICY "Authenticated users can insert products" ON public.products
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'Users can update their own products'
  ) THEN
    CREATE POLICY "Users can update their own products" ON public.products
      FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.brands b WHERE b.id = brand_id)
      );
  END IF;
END
$$; 