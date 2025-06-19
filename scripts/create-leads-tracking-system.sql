-- Leads Tracking System for OmaHub
-- This system tracks bookings, leads, and financial metrics to measure the value OmaHub brings to designers

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

-- 8. Create RLS policies

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

CREATE POLICY "Super admins can manage financial metrics" 
  ON public.brand_financial_metrics FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
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

-- 9. Create triggers for automatic calculations

-- Function to calculate commission amount
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate commission amount based on booking value and rate
  NEW.commission_amount = ROUND((NEW.booking_value * NEW.commission_rate / 100), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate commission on booking insert/update
CREATE TRIGGER calculate_booking_commission
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission();

-- Function to update lead status when booking is created
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lead status to converted when booking is created
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

-- Trigger to update lead when booking is created
CREATE TRIGGER update_lead_on_booking_trigger
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_booking();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

CREATE TRIGGER update_bookings_updated_at_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

CREATE TRIGGER update_brand_financial_metrics_updated_at_trigger
  BEFORE UPDATE ON public.brand_financial_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

CREATE TRIGGER update_commission_structure_updated_at_trigger
  BEFORE UPDATE ON public.commission_structure
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- 10. Create function to calculate and update financial metrics
CREATE OR REPLACE FUNCTION update_brand_financial_metrics(target_brand_id TEXT, target_month_year DATE)
RETURNS void AS $$
DECLARE
  lead_count INTEGER;
  qualified_count INTEGER;
  converted_count INTEGER;
  booking_count INTEGER;
  total_value DECIMAL(10,2);
  total_commission DECIMAL(10,2);
  conversion_rate DECIMAL(5,2);
  avg_booking_value DECIMAL(10,2);
BEGIN
  -- Calculate metrics for the specified brand and month
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'qualified'),
    COUNT(*) FILTER (WHERE status = 'converted')
  INTO lead_count, qualified_count, converted_count
  FROM public.leads
  WHERE brand_id = target_brand_id
    AND DATE_TRUNC('month', created_at) = target_month_year;

  SELECT 
    COUNT(*),
    COALESCE(SUM(booking_value), 0),
    COALESCE(SUM(commission_amount), 0),
    COALESCE(AVG(booking_value), 0)
  INTO booking_count, total_value, total_commission, avg_booking_value
  FROM public.bookings
  WHERE brand_id = target_brand_id
    AND DATE_TRUNC('month', booking_date) = target_month_year
    AND status NOT IN ('cancelled', 'refunded');

  -- Calculate conversion rate
  conversion_rate = CASE 
    WHEN lead_count > 0 THEN ROUND((converted_count::DECIMAL / lead_count::DECIMAL) * 100, 2)
    ELSE 0
  END;

  -- Insert or update the metrics
  INSERT INTO public.brand_financial_metrics (
    brand_id, month_year, total_leads, qualified_leads, converted_leads,
    total_bookings, total_booking_value, total_commission_earned,
    conversion_rate, average_booking_value, updated_at
  ) VALUES (
    target_brand_id, target_month_year, lead_count, qualified_count, converted_count,
    booking_count, total_value, total_commission,
    conversion_rate, avg_booking_value, NOW()
  )
  ON CONFLICT (brand_id, month_year) DO UPDATE SET
    total_leads = EXCLUDED.total_leads,
    qualified_leads = EXCLUDED.qualified_leads,
    converted_leads = EXCLUDED.converted_leads,
    total_bookings = EXCLUDED.total_bookings,
    total_booking_value = EXCLUDED.total_booking_value,
    total_commission_earned = EXCLUDED.total_commission_earned,
    conversion_rate = EXCLUDED.conversion_rate,
    average_booking_value = EXCLUDED.average_booking_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get comprehensive leads analytics
CREATE OR REPLACE FUNCTION get_leads_analytics(admin_user_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  qualified_leads BIGINT,
  converted_leads BIGINT,
  total_bookings BIGINT,
  total_booking_value DECIMAL(10,2),
  total_commission_earned DECIMAL(10,2),
  average_booking_value DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),
  this_month_leads BIGINT,
  this_month_bookings BIGINT,
  this_month_revenue DECIMAL(10,2),
  this_month_commission DECIMAL(10,2),
  top_performing_brands JSONB,
  leads_by_source JSONB,
  bookings_by_type JSONB,
  monthly_trends JSONB
) AS $$
DECLARE
  user_role TEXT;
  user_brands TEXT[];
  current_month_start DATE;
BEGIN
  -- Get user profile to determine access level
  SELECT role, owned_brands INTO user_role, user_brands
  FROM profiles
  WHERE id = admin_user_id;
  
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Build query based on role
  IF user_role = 'super_admin' THEN
    -- Super admin sees all data
    RETURN QUERY
    SELECT 
      (SELECT COUNT(*) FROM leads)::BIGINT as total_leads,
      (SELECT COUNT(*) FROM leads WHERE status = 'qualified')::BIGINT as qualified_leads,
      (SELECT COUNT(*) FROM leads WHERE status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*) FROM bookings WHERE status NOT IN ('cancelled', 'refunded'))::BIGINT as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as total_booking_value,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as total_commission_earned,
      (SELECT COALESCE(AVG(booking_value), 0) FROM bookings WHERE status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as average_booking_value,
      (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) ELSE 0 END FROM leads)::DECIMAL(5,2) as conversion_rate,
      (SELECT COUNT(*) FROM leads WHERE DATE_TRUNC('month', created_at) = current_month_start)::BIGINT as this_month_leads,
      (SELECT COUNT(*) FROM bookings WHERE DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::BIGINT as this_month_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as this_month_revenue,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as this_month_commission,
      (SELECT COALESCE(jsonb_agg(brand_data), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('brand_id', b.brand_id, 'brand_name', br.name, 'total_revenue', b.total_booking_value, 'total_commission', b.total_commission_earned) as brand_data
        FROM brand_financial_metrics b
        JOIN brands br ON b.brand_id = br.id
        ORDER BY b.total_booking_value DESC
        LIMIT 10
      ) top_brands) as top_performing_brands,
      (SELECT COALESCE(jsonb_object_agg(source, count), '{}'::jsonb) FROM (
        SELECT source, COUNT(*) as count FROM leads GROUP BY source
      ) t) as leads_by_source,
      (SELECT COALESCE(jsonb_object_agg(booking_type, count), '{}'::jsonb) FROM (
        SELECT booking_type, COUNT(*) as count FROM bookings WHERE status NOT IN ('cancelled', 'refunded') GROUP BY booking_type
      ) t) as bookings_by_type,
      (SELECT COALESCE(jsonb_agg(monthly_data), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', month_year, 'leads', SUM(total_leads), 'bookings', SUM(total_bookings), 'revenue', SUM(total_booking_value), 'commission', SUM(total_commission_earned)) as monthly_data
        FROM brand_financial_metrics
        WHERE month_year >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY month_year
        ORDER BY month_year DESC
        LIMIT 12
      ) trends) as monthly_trends;
  ELSE
    -- Brand admin sees only their brands' data
    RETURN QUERY
    SELECT 
      (SELECT COUNT(*) FROM leads WHERE brand_id = ANY(user_brands))::BIGINT as total_leads,
      (SELECT COUNT(*) FROM leads WHERE brand_id = ANY(user_brands) AND status = 'qualified')::BIGINT as qualified_leads,
      (SELECT COUNT(*) FROM leads WHERE brand_id = ANY(user_brands) AND status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*) FROM bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded'))::BIGINT as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as total_booking_value,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as total_commission_earned,
      (SELECT COALESCE(AVG(booking_value), 0) FROM bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as average_booking_value,
      (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) ELSE 0 END FROM leads WHERE brand_id = ANY(user_brands))::DECIMAL(5,2) as conversion_rate,
      (SELECT COUNT(*) FROM leads WHERE brand_id = ANY(user_brands) AND DATE_TRUNC('month', created_at) = current_month_start)::BIGINT as this_month_leads,
      (SELECT COUNT(*) FROM bookings WHERE brand_id = ANY(user_brands) AND DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::BIGINT as this_month_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE brand_id = ANY(user_brands) AND DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as this_month_revenue,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE brand_id = ANY(user_brands) AND DATE_TRUNC('month', booking_date) = current_month_start AND status NOT IN ('cancelled', 'refunded'))::DECIMAL(10,2) as this_month_commission,
      '[]'::jsonb as top_performing_brands, -- Brand admins don't see this comparison
      (SELECT COALESCE(jsonb_object_agg(source, count), '{}'::jsonb) FROM (
        SELECT source, COUNT(*) as count FROM leads WHERE brand_id = ANY(user_brands) GROUP BY source
      ) t) as leads_by_source,
      (SELECT COALESCE(jsonb_object_agg(booking_type, count), '{}'::jsonb) FROM (
        SELECT booking_type, COUNT(*) as count FROM bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded') GROUP BY booking_type
      ) t) as bookings_by_type,
      (SELECT COALESCE(jsonb_agg(monthly_data), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', month_year, 'leads', SUM(total_leads), 'bookings', SUM(total_bookings), 'revenue', SUM(total_booking_value), 'commission', SUM(total_commission_earned)) as monthly_data
        FROM brand_financial_metrics
        WHERE brand_id = ANY(user_brands) AND month_year >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY month_year
        ORDER BY month_year DESC
        LIMIT 12
      ) trends) as monthly_trends;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_leads_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_brand_financial_metrics(TEXT, DATE) TO authenticated;

-- 12. Insert default commission structure
INSERT INTO public.commission_structure (booking_type, min_booking_value, commission_rate, currency) VALUES
('custom_order', 0, 5.00, 'USD'),
('ready_to_wear', 0, 3.00, 'USD'),
('consultation', 0, 10.00, 'USD'),
('fitting', 0, 8.00, 'USD'),
('alteration', 0, 15.00, 'USD'),
('rental', 0, 7.00, 'USD')
ON CONFLICT DO NOTHING;

-- 13. Create sample data for testing (using real brand IDs)
DO $$
DECLARE
    brand_ids TEXT[];
    sample_brand_id TEXT;
    sample_lead_id UUID;
BEGIN
    -- Get first 3 brand IDs from the database
    SELECT ARRAY(SELECT id FROM public.brands LIMIT 3) INTO brand_ids;
    
    -- Only insert if we have brands
    IF array_length(brand_ids, 1) >= 1 THEN
        sample_brand_id := brand_ids[1];
        
        -- Insert sample lead
        INSERT INTO public.leads (brand_id, customer_name, customer_email, customer_phone, source, lead_type, status, estimated_value, notes)
        VALUES (sample_brand_id, 'Sarah Williams', 'sarah.williams@email.com', '+1-555-0123', 'website', 'booking_intent', 'qualified', 2500.00, 'Interested in custom wedding dress for June 2024')
        RETURNING id INTO sample_lead_id;
        
        -- Insert sample booking
        INSERT INTO public.bookings (lead_id, brand_id, customer_name, customer_email, customer_phone, booking_type, booking_value, commission_rate, currency, notes)
        VALUES (sample_lead_id, sample_brand_id, 'Sarah Williams', 'sarah.williams@email.com', '+1-555-0123', 'custom_order', 2800.00, 5.00, 'USD', 'Custom wedding dress with beadwork - deposit paid');
        
        -- Update financial metrics for current month
        PERFORM update_brand_financial_metrics(sample_brand_id, DATE_TRUNC('month', CURRENT_DATE));
    END IF;
    
    IF array_length(brand_ids, 1) >= 2 THEN
        sample_brand_id := brand_ids[2];
        
        -- Insert more sample data
        INSERT INTO public.leads (brand_id, customer_name, customer_email, source, lead_type, status, estimated_value)
        VALUES (sample_brand_id, 'Michael Chen', 'michael.chen@email.com', 'instagram', 'quote_request', 'new', 1200.00);
        
        INSERT INTO public.leads (brand_id, customer_name, customer_email, source, lead_type, status, estimated_value)
        VALUES (sample_brand_id, 'Aisha Okafor', 'aisha.okafor@email.com', 'referral', 'consultation', 'contacted', 800.00);
        
        -- Update financial metrics
        PERFORM update_brand_financial_metrics(sample_brand_id, DATE_TRUNC('month', CURRENT_DATE));
    END IF;
END $$;

-- 14. Create view for easy access to leads with brand information
CREATE OR REPLACE VIEW public.leads_with_brand_details AS
SELECT 
  l.id,
  l.brand_id,
  b.name as brand_name,
  b.category as brand_category,
  b.image as brand_image,
  l.customer_name,
  l.customer_email,
  l.customer_phone,
  l.source,
  l.lead_type,
  l.status,
  l.priority,
  l.estimated_value,
  l.notes,
  l.created_at,
  l.updated_at,
  l.contacted_at,
  l.qualified_at,
  l.converted_at,
  -- Count of interactions
  COALESCE(interactions.interaction_count, 0) as interaction_count,
  -- Latest interaction
  interactions.latest_interaction_date,
  interactions.latest_interaction_type,
  -- Booking information if converted
  bk.id as booking_id,
  bk.booking_value,
  bk.commission_amount,
  bk.booking_date,
  bk.status as booking_status
FROM public.leads l
LEFT JOIN public.brands b ON l.brand_id = b.id
LEFT JOIN (
  SELECT 
    lead_id,
    COUNT(*) as interaction_count,
    MAX(interaction_date) as latest_interaction_date,
    (SELECT interaction_type FROM public.lead_interactions li2 
     WHERE li2.lead_id = li.lead_id 
     ORDER BY interaction_date DESC LIMIT 1) as latest_interaction_type
  FROM public.lead_interactions li
  GROUP BY lead_id
) interactions ON l.id = interactions.lead_id
LEFT JOIN public.bookings bk ON l.id = bk.lead_id
ORDER BY l.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.leads_with_brand_details TO authenticated;

-- 15. Verification
SELECT 'Leads Tracking System setup completed successfully!' as status;

-- Show sample data if any was created
SELECT 'Sample leads created:' as info, COUNT(*) as count FROM public.leads;
SELECT 'Sample bookings created:' as info, COUNT(*) as count FROM public.bookings;
SELECT 'Commission structures available:' as info, COUNT(*) as count FROM public.commission_structure; 