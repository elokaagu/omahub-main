-- SIMPLE Newsletter System Setup - Run this step by step
-- Copy and paste each section separately into your Supabase SQL editor

-- ========================================
-- STEP 1: Create the main subscribers table
-- ========================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'unsubscribed', 'bounced', 'pending')),
    source TEXT DEFAULT 'website' CHECK (source IN ('website', 'contact_form', 'studio_signup', 'manual_import')),
    preferences JSONB DEFAULT '{"marketing": true, "designer_updates": true, "events": true}'::jsonb,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    last_email_sent TIMESTAMPTZ,
    email_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- STEP 2: Create basic indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(subscription_status);

-- ========================================
-- STEP 3: Enable RLS
-- ========================================
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Create RLS policies
-- ========================================
-- Super admins can manage all subscribers
CREATE POLICY "Super admins can manage all newsletter subscribers" ON public.newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Anyone can subscribe (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- ========================================
-- STEP 5: Create the trigger function
-- ========================================
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 6: Create the trigger
-- ========================================
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON public.newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

-- ========================================
-- STEP 7: Test the setup
-- ========================================
-- Try inserting a test subscriber
INSERT INTO public.newsletter_subscribers (email, first_name, last_name, source) 
VALUES ('test@example.com', 'Test', 'User', 'website')
ON CONFLICT (email) DO NOTHING;

-- Check if it worked
SELECT * FROM public.newsletter_subscribers WHERE email = 'test@example.com';

-- ========================================
-- STEP 8: Clean up test data
-- ========================================
DELETE FROM public.newsletter_subscribers WHERE email = 'test@example.com';

-- ========================================
-- STEP 9: Verify table structure
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'newsletter_subscribers'
ORDER BY ordinal_position;
