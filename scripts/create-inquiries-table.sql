-- ========================================
-- OMAHUB: Create Inquiries Table
-- ========================================
-- This script creates the missing inquiries table for contact forms

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    inquiry_type TEXT DEFAULT 'customer_inquiry' CHECK (inquiry_type IN ('customer_inquiry', 'quote_request', 'booking_intent', 'consultation', 'product_interest', 'partnership', 'other')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', ' normal', 'high', 'urgent')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed', 'archived')),
    source TEXT DEFAULT 'website_contact_form' CHECK (source IN ('website_contact_form', 'brand_contact_form', 'email', 'phone', 'social_media', 'referral', 'other')),
    estimated_budget DECIMAL(10,2),
    project_timeline TEXT,
    location TEXT,
    notes TEXT,
    tags TEXT[],
    assigned_to UUID REFERENCES public.profiles(id),
    replied_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Super admins can manage all inquiries" ON public.inquiries;
CREATE POLICY "Super admins can manage all inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Brand admins can manage their brand inquiries" ON public.inquiries;
CREATE POLICY "Brand admins can manage their brand inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.owned_brands @> ARRAY[inquiries.brand_id::text]
        )
    );

DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;
CREATE POLICY "Anyone can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Show completion status
SELECT '🎉 OmaHub Inquiries Table Created Successfully!' as status;
