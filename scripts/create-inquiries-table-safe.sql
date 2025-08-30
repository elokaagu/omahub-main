-- ========================================
-- OMAHUB: Create Inquiries & Notifications Tables
-- ========================================
-- This script creates the missing database tables for the Studio Inbox
-- It handles existing tables and policies safely without conflicts

-- ========================================
-- STEP 1: Create Core Tables
-- ========================================

-- Create inquiries table for customer messages
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'customer_inquiry', 'quote_request', 'booking_intent', 'consultation', 'product_interest', 'partnership', 'other')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
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

-- Create notifications table for system alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('inquiry', 'review', 'order', 'application', 'system', 'other')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- STEP 2: Performance Optimization
-- ========================================

-- Create indexes for inquiries table
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON public.inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON public.inquiries(inquiry_type);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON public.notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ========================================
-- STEP 3: Security & Access Control
-- ========================================

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DO $$
BEGIN
    -- Remove existing inquiry policies
    DROP POLICY IF EXISTS "Super admins can manage all inquiries" ON public.inquiries;
    DROP POLICY IF EXISTS "Brand admins can manage their brand inquiries" ON public.inquiries;
    DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;
    
    -- Remove existing notification policies
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;
    
    RAISE NOTICE 'Cleaned up existing policies';
END $$;

-- Create OmaHub-style access policies for inquiries
CREATE POLICY "Super admins can manage all inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Brand admins can manage their brand inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.owned_brands @> ARRAY[inquiries.brand_id::text]
        )
    );

CREATE POLICY "Anyone can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Create OmaHub-style access policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- ========================================
-- STEP 4: Data Integrity & Automation
-- ========================================

-- Create timestamp update functions
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

-- Create automated timestamp triggers
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiries_updated_at();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- ========================================
-- STEP 5: Documentation & Metadata
-- ========================================

-- Add table descriptions
COMMENT ON TABLE public.inquiries IS 'OmaHub: Customer inquiries and messages from contact forms across the platform';
COMMENT ON TABLE public.notifications IS 'OmaHub: System notifications and alerts for users and brand owners';

-- Add column descriptions for key fields
COMMENT ON COLUMN public.inquiries.brand_id IS 'Reference to the brand this inquiry is about';
COMMENT ON COLUMN public.inquiries.customer_name IS 'Name of the customer making the inquiry';
COMMENT ON COLUMN public.inquiries.customer_email IS 'Email address for customer communication';
COMMENT ON COLUMN public.inquiries.status IS 'Current status: new, read, replied, closed, archived';
COMMENT ON COLUMN public.inquiries.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN public.inquiries.source IS 'How the inquiry was submitted';

COMMENT ON COLUMN public.notifications.user_id IS 'User who should receive this notification';
COMMENT ON COLUMN public.notifications.brand_id IS 'Brand this notification relates to';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification: inquiry, review, order, application, system';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the user has read this notification';

-- ========================================
-- STEP 6: Verification & Status
-- ========================================

-- Show completion status
SELECT '🎉 OmaHub Inquiries & Notifications System Setup Complete!' as status;

-- Display table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('inquiries', 'notifications')
ORDER BY table_name, ordinal_position;

-- Show created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('inquiries', 'notifications')
ORDER BY tablename, policyname;

-- ========================================
-- STEP 7: Test Data (Optional)
-- ========================================

-- Uncomment the following lines to add a test inquiry
/*
INSERT INTO public.inquiries (
    brand_id, 
    customer_name, 
    customer_email, 
    subject, 
    message, 
    inquiry_type, 
    priority, 
    source
) VALUES (
    (SELECT id FROM public.brands LIMIT 1),
    'Test Customer',
    'test@omahub.com',
    'Test Inquiry for OmaHub',
    'This is a test inquiry to verify the OmaHub inbox system is working correctly.',
    'general',
    'normal',
    'website_contact_form'
);
*/

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ OmaHub Studio Inbox is now ready to receive and display customer inquiries!' as final_status;
