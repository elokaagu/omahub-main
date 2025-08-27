-- Add brand contact email system
-- This script adds contact_email field and sets up proper RLS policies

-- Step 1: Add contact_email column to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Step 2: Add a comment to explain the field
COMMENT ON COLUMN public.brands.contact_email IS 'Primary contact email for customer inquiry notifications. If not set, defaults to info@oma-hub.com';

-- Step 3: Update existing brands that don't have a contact_email with the default
UPDATE public.brands 
SET contact_email = 'info@oma-hub.com'
WHERE contact_email IS NULL OR contact_email = '';

-- Step 4: Add RLS policy for brands table to allow authenticated users to read
-- This ensures customers can see brand information for contact forms
DROP POLICY IF EXISTS "Brands are viewable by everyone" ON public.brands;
CREATE POLICY "Brands are viewable by everyone" ON public.brands
    FOR SELECT USING (true);

-- Step 5: Add RLS policy for brands table to allow brand owners to update their own brand
DROP POLICY IF EXISTS "Brand owners can update their own brand" ON public.brands;
CREATE POLICY "Brand owners can update their own brand" ON public.brands
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role::text IN ('admin', 'super_admin')
                OR (profiles.role::text = 'brand_admin' AND brands.id = ANY(profiles.owned_brands))
            )
        )
    );

-- Step 6: Add RLS policy for brands table to allow brand owners to insert
DROP POLICY IF EXISTS "Brand owners can insert brands" ON public.brands;
CREATE POLICY "Brand owners can insert brands" ON public.brands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role::text IN ('admin', 'super_admin', 'brand_admin')
        )
    );

-- Step 7: Ensure inquiries table has proper RLS policies
-- Allow authenticated users to create inquiries
DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;
CREATE POLICY "Users can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow brand owners to view inquiries for their brands
DROP POLICY IF EXISTS "Brand owners can view their inquiries" ON public.inquiries;
CREATE POLICY "Brand owners can view their inquiries" ON public.inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role::text IN ('admin', 'super_admin')
                OR (profiles.role::text = 'brand_admin' AND inquiries.brand_id = ANY(profiles.owned_brands))
            )
        )
    );

-- Allow brand owners to update inquiry status
DROP POLICY IF EXISTS "Brand owners can update their inquiries" ON public.inquiries;
CREATE POLICY "Brand owners can update their inquiries" ON public.inquiries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role::text IN ('admin', 'super_admin')
                OR (profiles.role::text = 'brand_admin' AND inquiries.brand_id = ANY(profiles.owned_brands))
            )
        )
    );

-- Step 8: Verify the migration
SELECT 
    COUNT(*) as total_brands,
    COUNT(CASE WHEN contact_email = 'info@oma-hub.com' THEN 1 END) as brands_with_default_email,
    COUNT(CASE WHEN contact_email IS NOT NULL AND contact_email != '' THEN 1 END) as brands_with_email
FROM public.brands;

-- Step 9: Show sample of brands and their contact emails
SELECT id, name, contact_email, created_at 
FROM public.brands 
ORDER BY created_at DESC 
LIMIT 10;
