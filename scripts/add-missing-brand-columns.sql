-- Add missing columns to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS founded_year TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing brands to have updated_at timestamp
UPDATE public.brands 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the migration
SELECT id, name, website, instagram, founded_year, updated_at FROM public.brands LIMIT 5; 