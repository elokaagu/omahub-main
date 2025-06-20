-- Leads Tracking System for OmaHub (Fixed Version)
-- This system tracks bookings, leads, and financial metrics to measure the value OmaHub brings to designers

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Super admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Brand admins can view their brand leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Brand admins can view their brand bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can view financial metrics" ON public.brand_financial_metrics;
DROP POLICY IF EXISTS "Brand admins can view their financial metrics" ON public.brand_financial_metrics;
DROP POLICY IF EXISTS "Admins can manage financial metrics" ON public.brand_financial_metrics;
DROP POLICY IF EXISTS "Admins can view lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Admins can manage lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Super admins can manage commission structure" ON public.commission_structure;

-- 1. Create leads table to track all customer interactions that could lead to bookings
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  source VARCHAR(50) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'instagram', 'email', 'phone', 'referral', 'direct')),
  lead_type VARCHAR(50) NOT NULL DEFAULT 'inquiry' CHECK (lead_type IN ('inquiry', 'quote_request', 'booking_intent', 'consultation', 'product_interest')),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'closed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_value DECIMAL(10,2), -- Estimated potential booking value
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- 2. Create bookings table to track actual confirmed bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  booking_type VARCHAR(50) NOT NULL DEFAULT 'custom_order' CHECK (booking_type IN ('custom_order', 'ready_to_wear', 'consultation', 'fitting', 'alteration', 'rental')),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled', 'refunded')),
  booking_value DECIMAL(10,2) NOT NULL, -- Actual booking amount
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Commission percentage (e.g., 5.00 for 5%)
  commission_amount DECIMAL(10,2) DEFAULT 0.00, -- Calculated commission amount
  currency VARCHAR(3) DEFAULT 'USD',
  booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create brand_financial_metrics table to track aggregated financial data per brand
CREATE TABLE IF NOT EXISTS public.brand_financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of the month for grouping
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_booking_value DECIMAL(10,2) DEFAULT 0.00,
  total_commission_earned DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of leads that convert
  average_booking_value DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, month_year)
);

-- 4. Create lead_interactions table to track all touchpoints
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('email', 'phone', 'whatsapp', 'meeting', 'quote_sent', 'follow_up', 'note')),
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create commission_structure table to manage different commission rates
CREATE TABLE IF NOT EXISTS public.commission_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  booking_type VARCHAR(50) NOT NULL,
  min_booking_value DECIMAL(10,2) DEFAULT 0.00,
  max_booking_value DECIMAL(10,2),
  commission_rate DECIMAL(5,2) NOT NULL, -- Percentage
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_brand_id ON public.leads(brand_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON public.leads(lead_type);

CREATE INDEX IF NOT EXISTS idx_bookings_brand_id ON public.bookings(brand_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON public.bookings(lead_id);

CREATE INDEX IF NOT EXISTS idx_brand_financial_metrics_brand_id ON public.brand_financial_metrics(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_financial_metrics_month_year ON public.brand_financial_metrics(month_year DESC);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_date ON public.lead_interactions(interaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_commission_structure_brand_id ON public.commission_structure(brand_id);
CREATE INDEX IF NOT EXISTS idx_commission_structure_active ON public.commission_structure(is_active);

-- 7. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_structure ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (recreate them fresh)

-- Leads policies
CREATE POLICY "Super admins can view all leads" 
  ON public.leads FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Brand admins can view their brand leads" 
  ON public.leads FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Admins can manage leads" 
  ON public.leads FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

-- Bookings policies
CREATE POLICY "Super admins can view all bookings" 
  ON public.bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Brand admins can view their brand bookings" 
  ON public.bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Admins can manage bookings" 
  ON public.bookings FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

-- Financial metrics policies (Super admin only)
CREATE POLICY "Super admins can view financial metrics" 
  ON public.brand_financial_metrics FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Brand admins can view their financial metrics" 
  ON public.brand_financial_metrics FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Admins can manage financial metrics" 
  ON public.brand_financial_metrics FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

-- Lead interactions policies
CREATE POLICY "Admins can view lead interactions" 
  ON public.lead_interactions FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

CREATE POLICY "Admins can manage lead interactions" 
  ON public.lead_interactions FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'brand_admin')
    )
  );

-- Commission structure policies (Super admin only)
CREATE POLICY "Super admins can manage commission structure" 
  ON public.commission_structure FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- 9. Create or replace functions

-- Function to calculate commission automatically
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple calculation: commission_amount = booking_value * (commission_rate / 100)
  NEW.commission_amount = NEW.booking_value * (NEW.commission_rate / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS calculate_booking_commission ON public.bookings;
CREATE TRIGGER calculate_booking_commission
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission();

-- Function to update lead status when booking is created
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads 
    SET status = 'converted', 
        converted_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead status update
DROP TRIGGER IF EXISTS update_lead_on_booking_trigger ON public.bookings;
CREATE TRIGGER update_lead_on_booking_trigger
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_booking();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON public.leads;
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

DROP TRIGGER IF EXISTS update_bookings_updated_at_trigger ON public.bookings;
CREATE TRIGGER update_bookings_updated_at_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

DROP TRIGGER IF EXISTS update_brand_financial_metrics_updated_at_trigger ON public.brand_financial_metrics;
CREATE TRIGGER update_brand_financial_metrics_updated_at_trigger
  BEFORE UPDATE ON public.brand_financial_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

DROP TRIGGER IF EXISTS update_commission_structure_updated_at_trigger ON public.commission_structure;
CREATE TRIGGER update_commission_structure_updated_at_trigger
  BEFORE UPDATE ON public.commission_structure
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- 10. Create analytics function
DROP FUNCTION IF EXISTS get_leads_analytics(UUID);
CREATE OR REPLACE FUNCTION get_leads_analytics(admin_user_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  new_leads BIGINT,
  qualified_leads BIGINT,
  converted_leads BIGINT,
  total_bookings BIGINT,
  total_booking_value NUMERIC,
  conversion_rate NUMERIC,
  leads_this_month BIGINT,
  bookings_this_month BIGINT
) AS $$
DECLARE
  user_role TEXT;
  user_brands TEXT[];
BEGIN
  -- Get user role and owned brands
  SELECT p.role, p.owned_brands INTO user_role, user_brands
  FROM public.profiles p 
  WHERE p.id = admin_user_id;

  -- Return analytics based on user permissions
  IF user_role = 'super_admin' THEN
    -- Super admin sees all data
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_leads,
      COUNT(*) FILTER (WHERE l.status = 'new')::BIGINT as new_leads,
      COUNT(*) FILTER (WHERE l.status = 'qualified')::BIGINT as qualified_leads,
      COUNT(*) FILTER (WHERE l.status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*)::BIGINT FROM public.bookings) as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings) as total_booking_value,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE l.status = 'converted')::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0
      END as conversion_rate,
      COUNT(*) FILTER (WHERE l.created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as leads_this_month,
      (SELECT COUNT(*)::BIGINT FROM public.bookings WHERE booking_date >= DATE_TRUNC('month', CURRENT_DATE)) as bookings_this_month
    FROM public.leads l;
    
  ELSIF user_role = 'brand_admin' AND user_brands IS NOT NULL THEN
    -- Brand admin sees only their brands' data
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_leads,
      COUNT(*) FILTER (WHERE l.status = 'new')::BIGINT as new_leads,
      COUNT(*) FILTER (WHERE l.status = 'qualified')::BIGINT as qualified_leads,
      COUNT(*) FILTER (WHERE l.status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*)::BIGINT FROM public.bookings b WHERE b.brand_id = ANY(user_brands)) as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings b WHERE b.brand_id = ANY(user_brands)) as total_booking_value,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE l.status = 'converted')::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0
      END as conversion_rate,
      COUNT(*) FILTER (WHERE l.created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as leads_this_month,
      (SELECT COUNT(*)::BIGINT FROM public.bookings b WHERE b.brand_id = ANY(user_brands) AND b.booking_date >= DATE_TRUNC('month', CURRENT_DATE)) as bookings_this_month
    FROM public.leads l
    WHERE l.brand_id = ANY(user_brands);
    
  ELSE
    -- No access - return zeros
    RETURN QUERY
    SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC, 0::NUMERIC, 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create view for leads with brand details
DROP VIEW IF EXISTS public.leads_with_brand_details;
CREATE OR REPLACE VIEW public.leads_with_brand_details AS
SELECT 
  l.*,
  b.name as brand_name,
  b.location as brand_location,
  b.category as brand_category
FROM public.leads l
JOIN public.brands b ON l.brand_id = b.id;

-- 12. Insert some sample data for testing
INSERT INTO public.leads (brand_id, customer_name, customer_email, customer_phone, source, lead_type, status, estimated_value, notes) 
SELECT 
  b.id,
  'Sample Customer ' || ROW_NUMBER() OVER(),
  'customer' || ROW_NUMBER() OVER() || '@example.com',
  '+1234567890',
  'website',
  'inquiry',
  'new',
  500.00,
  'Sample lead for testing'
FROM public.brands b
LIMIT 5
ON CONFLICT DO NOTHING;

-- 13. Grant permissions
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.brand_financial_metrics TO authenticated;
GRANT SELECT ON public.lead_interactions TO authenticated;
GRANT SELECT ON public.commission_structure TO authenticated;
GRANT SELECT ON public.leads_with_brand_details TO authenticated;

-- 14. Verify setup
SELECT 'Leads Tracking System Setup Complete!' as status;
SELECT 
  'leads' as table_name, 
  COUNT(*) as record_count 
FROM public.leads
UNION ALL
SELECT 
  'bookings' as table_name, 
  COUNT(*) as record_count 
FROM public.bookings
UNION ALL
SELECT 
  'brand_financial_metrics' as table_name, 
  COUNT(*) as record_count 
FROM public.brand_financial_metrics; 