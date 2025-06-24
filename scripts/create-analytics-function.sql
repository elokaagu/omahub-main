-- Create the analytics function for leads tracking
-- Run this in your Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.get_leads_analytics()
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM public.leads), 0)::BIGINT as total_leads,
    COALESCE((SELECT COUNT(*) FROM public.leads WHERE status = 'qualified'), 0)::BIGINT as qualified_leads,
    COALESCE((SELECT COUNT(*) FROM public.leads WHERE status = 'converted'), 0)::BIGINT as converted_leads,
    COALESCE((SELECT COUNT(*) FROM public.bookings), 0)::BIGINT as total_bookings,
    COALESCE((SELECT SUM(booking_value) FROM public.bookings), 0)::NUMERIC as total_booking_value,
    COALESCE((SELECT SUM(commission_amount) FROM public.bookings), 0)::NUMERIC as total_commission_earned,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.bookings) > 0 
      THEN (SELECT AVG(booking_value) FROM public.bookings)
      ELSE 0
    END::NUMERIC as average_booking_value,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.leads) > 0 
      THEN ((SELECT COUNT(*) FROM public.leads WHERE status = 'converted')::NUMERIC / (SELECT COUNT(*) FROM public.leads)::NUMERIC * 100)
      ELSE 0
    END::NUMERIC as conversion_rate,
    COALESCE((SELECT COUNT(*) FROM public.leads WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)::BIGINT as this_month_leads,
    COALESCE((SELECT COUNT(*) FROM public.bookings WHERE booking_date >= DATE_TRUNC('month', CURRENT_DATE)), 0)::BIGINT as this_month_bookings,
    COALESCE((SELECT SUM(booking_value) FROM public.bookings WHERE booking_date >= DATE_TRUNC('month', CURRENT_DATE)), 0)::NUMERIC as this_month_revenue,
    COALESCE((SELECT SUM(commission_amount) FROM public.bookings WHERE booking_date >= DATE_TRUNC('month', CURRENT_DATE)), 0)::NUMERIC as this_month_commission,
    '[]'::JSONB as top_performing_brands,
    jsonb_build_object(
      'website', COALESCE((SELECT COUNT(*) FROM public.leads WHERE source = 'website'), 0),
      'instagram', COALESCE((SELECT COUNT(*) FROM public.leads WHERE source = 'instagram'), 0),
      'referral', COALESCE((SELECT COUNT(*) FROM public.leads WHERE source = 'referral'), 0),
      'whatsapp', COALESCE((SELECT COUNT(*) FROM public.leads WHERE source = 'whatsapp'), 0),
      'other', COALESCE((SELECT COUNT(*) FROM public.leads WHERE source NOT IN ('website', 'instagram', 'referral', 'whatsapp')), 0)
    ) as leads_by_source,
    jsonb_build_object(
      'consultation', COALESCE((SELECT COUNT(*) FROM public.bookings WHERE booking_type = 'consultation'), 0),
      'service', COALESCE((SELECT COUNT(*) FROM public.bookings WHERE booking_type IN ('custom_order', 'fitting', 'alteration')), 0),
      'product', COALESCE((SELECT COUNT(*) FROM public.bookings WHERE booking_type = 'ready_to_wear'), 0),
      'other', COALESCE((SELECT COUNT(*) FROM public.bookings WHERE booking_type NOT IN ('consultation', 'custom_order', 'fitting', 'alteration', 'ready_to_wear')), 0)
    ) as bookings_by_type,
    '[]'::JSONB as monthly_trends;
END;
$$;

-- Test the function
SELECT * FROM public.get_leads_analytics(); 