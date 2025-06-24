-- Create collection_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON public.collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_display_order ON public.collection_images(collection_id, display_order);
CREATE INDEX IF NOT EXISTS idx_collection_images_featured ON public.collection_images(collection_id, is_featured);

-- Enable RLS
ALTER TABLE public.collection_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow public read access to collection images" ON public.collection_images;
CREATE POLICY "Allow public read access to collection images" 
  ON public.collection_images FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage collection images" ON public.collection_images;
CREATE POLICY "Allow authenticated users to manage collection images" 
  ON public.collection_images FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_collection_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_collection_images_updated_at ON public.collection_images;
CREATE TRIGGER update_collection_images_updated_at
    BEFORE UPDATE ON public.collection_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_collection_images_updated_at(); 