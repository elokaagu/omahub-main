-- Add missing columns to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS categories TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS founded_year TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the TypeScript interface to match
-- Note: The categories column stores an array of strings
-- The other columns are optional text fields 