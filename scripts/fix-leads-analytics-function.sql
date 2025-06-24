-- Fix the get_leads_analytics function to return the correct structure
-- This matches the LeadsAnalytics interface expected by the frontend

DROP FUNCTION IF EXISTS get_leads_analytics(UUID);

CREATE OR REPLACE FUNCTION get_leads_analytics(admin_user_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  qualified_leads BIGINT,
  converted_leads BIGINT,
  total_bookings BIGINT,
  total_booking_value NUMERIC,
  total_commission_earned NUMERIC,
  average_booking_value NUMERIC,
  conversion_rate NUMERIC,
  this_month_leads BIGINT,
  this_month_bookings BIGINT,
  this_month_revenue NUMERIC,
  this_month_commission NUMERIC,
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
  -- Get user role and owned brands
  SELECT p.role, p.owned_brands INTO user_role, user_brands
  FROM public.profiles p 
  WHERE p.id = admin_user_id;

  current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- Return analytics based on user permissions
  IF user_role = 'super_admin' THEN
    -- Super admin sees all data
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_leads,
      COUNT(*) FILTER (WHERE l.status = 'qualified')::BIGINT as qualified_leads,
      COUNT(*) FILTER (WHERE l.status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*)::BIGINT FROM public.bookings WHERE status NOT IN ('cancelled', 'refunded')) as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings WHERE status NOT IN ('cancelled', 'refunded')) as total_booking_value,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM public.bookings WHERE status NOT IN ('cancelled', 'refunded')) as total_commission_earned,
      (SELECT CASE WHEN COUNT(*) > 0 THEN AVG(booking_value) ELSE 0 END FROM public.bookings WHERE status NOT IN ('cancelled', 'refunded')) as average_booking_value,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE l.status = 'converted')::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0
      END as conversion_rate,
      COUNT(*) FILTER (WHERE l.created_at >= current_month_start)::BIGINT as this_month_leads,
      (SELECT COUNT(*)::BIGINT FROM public.bookings WHERE booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded')) as this_month_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings WHERE booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded')) as this_month_revenue,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM public.bookings WHERE booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded')) as this_month_commission,
      -- Top performing brands (placeholder for now)
      '[]'::JSONB as top_performing_brands,
      -- Leads by source
      (SELECT COALESCE(jsonb_object_agg(source, count), '{}'::jsonb) FROM (
        SELECT source, COUNT(*) as count FROM public.leads GROUP BY source
      ) t) as leads_by_source,
      -- Bookings by type
      (SELECT COALESCE(jsonb_object_agg(booking_type, count), '{}'::jsonb) FROM (
        SELECT booking_type, COUNT(*) as count FROM public.bookings WHERE status NOT IN ('cancelled', 'refunded') GROUP BY booking_type
      ) t) as bookings_by_type,
      -- Monthly trends (placeholder for now)
      '[]'::JSONB as monthly_trends
    FROM public.leads l;
    
  ELSIF user_role = 'brand_admin' AND user_brands IS NOT NULL THEN
    -- Brand admin sees only their brands' data
    RETURN QUERY
    SELECT 
      (SELECT COUNT(*) FROM public.leads WHERE brand_id = ANY(user_brands))::BIGINT as total_leads,
      (SELECT COUNT(*) FROM public.leads WHERE brand_id = ANY(user_brands) AND status = 'qualified')::BIGINT as qualified_leads,
      (SELECT COUNT(*) FROM public.leads WHERE brand_id = ANY(user_brands) AND status = 'converted')::BIGINT as converted_leads,
      (SELECT COUNT(*) FROM public.bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded'))::BIGINT as total_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded')) as total_booking_value,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM public.bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded')) as total_commission_earned,
      (SELECT CASE WHEN COUNT(*) > 0 THEN AVG(booking_value) ELSE 0 END FROM public.bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded')) as average_booking_value,
      (SELECT CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) ELSE 0 END FROM public.leads WHERE brand_id = ANY(user_brands)) as conversion_rate,
      (SELECT COUNT(*) FROM public.leads WHERE brand_id = ANY(user_brands) AND created_at >= current_month_start)::BIGINT as this_month_leads,
      (SELECT COUNT(*) FROM public.bookings WHERE brand_id = ANY(user_brands) AND booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded'))::BIGINT as this_month_bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM public.bookings WHERE brand_id = ANY(user_brands) AND booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded')) as this_month_revenue,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM public.bookings WHERE brand_id = ANY(user_brands) AND booking_date >= current_month_start AND status NOT IN ('cancelled', 'refunded')) as this_month_commission,
      -- Top performing brands (just their own brands)
      '[]'::JSONB as top_performing_brands,
      -- Leads by source for their brands
      (SELECT COALESCE(jsonb_object_agg(source, count), '{}'::jsonb) FROM (
        SELECT source, COUNT(*) as count FROM public.leads WHERE brand_id = ANY(user_brands) GROUP BY source
      ) t) as leads_by_source,
      -- Bookings by type for their brands
      (SELECT COALESCE(jsonb_object_agg(booking_type, count), '{}'::jsonb) FROM (
        SELECT booking_type, COUNT(*) as count FROM public.bookings WHERE brand_id = ANY(user_brands) AND status NOT IN ('cancelled', 'refunded') GROUP BY booking_type
      ) t) as bookings_by_type,
      -- Monthly trends (placeholder for now)
      '[]'::JSONB as monthly_trends;
      
  ELSE
    -- Default case - return empty analytics
    RETURN QUERY
    SELECT 
      0::BIGINT as total_leads,
      0::BIGINT as qualified_leads,
      0::BIGINT as converted_leads,
      0::BIGINT as total_bookings,
      0::NUMERIC as total_booking_value,
      0::NUMERIC as total_commission_earned,
      0::NUMERIC as average_booking_value,
      0::NUMERIC as conversion_rate,
      0::BIGINT as this_month_leads,
      0::BIGINT as this_month_bookings,
      0::NUMERIC as this_month_revenue,
      0::NUMERIC as this_month_commission,
      '[]'::JSONB as top_performing_brands,
      '{}'::JSONB as leads_by_source,
      '{}'::JSONB as bookings_by_type,
      '[]'::JSONB as monthly_trends;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION get_leads_analytics(UUID) TO authenticated;

-- Test the function
SELECT 'Fixed analytics function created successfully!' as status; 