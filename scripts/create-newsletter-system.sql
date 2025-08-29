-- Create Newsletter Subscription System for OmaHub
-- This system handles newsletter subscriptions with proper validation and admin management

-- Step 1: Create newsletter_subscribers table
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

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON public.newsletter_subscribers(source);

-- Step 3: Create newsletter_campaigns table for tracking email campaigns
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    unsubscribe_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Create newsletter_sends table for tracking individual email sends
CREATE TABLE IF NOT EXISTS public.newsletter_sends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounce_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for newsletter_subscribers
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

-- Step 7: Create RLS policies for newsletter_campaigns
-- Super admins can manage all campaigns
CREATE POLICY "Super admins can manage all newsletter campaigns" ON public.newsletter_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Step 8: Create RLS policies for newsletter_sends
-- Super admins can view all sends
CREATE POLICY "Super admins can view all newsletter sends" ON public.newsletter_sends
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Step 9: Create trigger function for updated_at (FIXED - create this BEFORE triggers)
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers for updated_at (FIXED - now the function exists)
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON public.newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON public.newsletter_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

CREATE TRIGGER update_newsletter_sends_updated_at
    BEFORE UPDATE ON public.newsletter_sends
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

-- Step 11: Add comments for documentation
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscribers with preferences and tracking';
COMMENT ON TABLE public.newsletter_campaigns IS 'Email campaigns for newsletter distribution';
COMMENT ON TABLE public.newsletter_sends IS 'Individual email sends tracking for analytics';

-- Step 12: Insert sample data for testing (optional)
-- INSERT INTO public.newsletter_subscribers (email, first_name, last_name, source) VALUES
-- ('test@example.com', 'Test', 'User', 'website');

-- Step 13: Verify the setup
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('newsletter_subscribers', 'newsletter_campaigns', 'newsletter_sends')
ORDER BY table_name, ordinal_position;
