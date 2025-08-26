-- Migration: Create brand_images table for normalized image management
-- This solves the image consistency issues by creating proper relationships

-- Step 1: Create the brand_images table
CREATE TABLE public.brand_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'cover', -- cover, logo, gallery, etc.
  storage_path text NOT NULL,         -- relative path in Supabase Storage
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (brand_id, role)             -- one cover per brand
);

-- Step 2: Add indexes for performance
CREATE INDEX idx_brand_images_brand_id ON public.brand_images(brand_id);
CREATE INDEX idx_brand_images_role ON public.brand_images(role);
CREATE INDEX idx_brand_images_storage_path ON public.brand_images(storage_path);

-- Step 3: Add RLS policies
ALTER TABLE public.brand_images ENABLE ROW LEVEL SECURITY;

-- Users can view all brand images
CREATE POLICY "Users can view all brand images" ON public.brand_images
  FOR SELECT USING (true);

-- Brand owners can manage their own brand images
CREATE POLICY "Brand owners can manage their own brand images" ON public.brand_images
  FOR ALL USING (
    brand_id IN (
      SELECT id FROM public.brands 
      WHERE owner_id = auth.uid()
    )
  );

-- Super admins can manage all brand images
CREATE POLICY "Super admins can manage all brand images" ON public.brand_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for updated_at
CREATE TRIGGER update_brand_images_updated_at
  BEFORE UPDATE ON public.brand_images
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_images_updated_at();

-- Step 6: Migrate existing brand.image data to brand_images table
-- This extracts the storage path from the full URL
INSERT INTO public.brand_images (brand_id, role, storage_path)
SELECT 
  id, 
  'cover', 
  CASE 
    WHEN image LIKE '%/storage/v1/object/public/brand-assets/%' 
    THEN regexp_replace(image, '^.*/storage/v1/object/public/brand-assets/', '')
    WHEN image LIKE '%/storage/v1/object/public/omahub/%' 
    THEN regexp_replace(image, '^.*/storage/v1/object/public/omahub/', '')
    ELSE image -- fallback to full URL if pattern doesn't match
  END
FROM public.brands
WHERE image IS NOT NULL AND image != '';

-- Step 7: Add comment for documentation
COMMENT ON TABLE public.brand_images IS 'Normalized table for brand image management. Replaces the brands.image column with proper relationships and storage path management.';
COMMENT ON COLUMN public.brand_images.role IS 'Image role: cover, logo, gallery, etc.';
COMMENT ON COLUMN public.brand_images.storage_path IS 'Relative path in Supabase Storage bucket, not full URL.';
