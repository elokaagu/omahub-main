-- Add WhatsApp field to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN public.brands.whatsapp IS 'WhatsApp phone number in international format (e.g., +234XXXXXXXXXX)';

-- Verify the migration
SELECT id, name, whatsapp, instagram, website FROM public.brands LIMIT 5; 