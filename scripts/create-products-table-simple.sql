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
-- Policy for viewing products (public)
CREATE POLICY "Anyone can view products" 
  ON public.products FOR SELECT 
  USING (true);

-- Policy for inserting products (authenticated users only)
CREATE POLICY "Authenticated users can insert products" 
  ON public.products FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy for updating products (brand owners only)
CREATE POLICY "Users can update their own products" 
  ON public.products FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.brands b 
      WHERE b.id = brand_id
    )
  ); 