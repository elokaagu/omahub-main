-- IMMEDIATE FIX FOR CONTACT FORM
-- Run this in your Supabase SQL Editor to fix the 500 error

-- 1. Create inquiries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50) DEFAULT 'customer_inquiry',
    priority VARCHAR(20) DEFAULT 'normal',
    source VARCHAR(50) DEFAULT 'website_contact_form',
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);

-- 3. Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Allow anyone to create inquiries (for contact forms)
CREATE POLICY "Anyone can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Allow brand owners to view inquiries for their brands
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

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.inquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inquiries TO anon;

-- 6. Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'inquiries'
ORDER BY ordinal_position;

-- 7. Test insert (optional - remove this line after testing)
-- INSERT INTO public.inquiries (brand_id, customer_name, customer_email, subject, message) 
-- VALUES ('test-brand-id', 'Test User', 'test@example.com', 'Test Inquiry', 'This is a test message');
