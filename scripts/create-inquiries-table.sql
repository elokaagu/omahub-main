-- Create Inquiries Table for Studio Inbox
-- This table stores customer inquiries and messages from contact forms

-- Step 1: Create inquiries table
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

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON public.inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON public.inquiries(inquiry_type);

-- Step 3: Create notifications table for system notifications
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

-- Step 4: Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON public.notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Step 5: Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for inquiries
-- Super admins can manage all inquiries
CREATE POLICY "Super admins can manage all inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Brand admins can manage inquiries for their brands
CREATE POLICY "Brand admins can manage their brand inquiries" ON public.inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.owned_brands @> ARRAY[inquiries.brand_id::text]
        )
    );

-- Anyone can create inquiries (INSERT)
CREATE POLICY "Anyone can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Step 7: Create RLS policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Super admins can manage all notifications
CREATE POLICY "Super admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Step 8: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiries_updated_at();

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.inquiries IS 'Customer inquiries and messages from contact forms';
COMMENT ON TABLE public.notifications IS 'System notifications for users';

-- Step 10: Insert sample data for testing (optional)
-- INSERT INTO public.inquiries (brand_id, customer_name, customer_email, subject, message, inquiry_type, priority, source) 
-- VALUES (
--     (SELECT id FROM public.brands LIMIT 1),
--     'Test Customer',
--     'test@example.com',
--     'Test Inquiry',
--     'This is a test inquiry to verify the system is working.',
--     'general',
--     'normal',
--     'website_contact_form'
-- );

-- Step 11: Verification
SELECT 'Inquiries and notifications tables created successfully!' as status;
