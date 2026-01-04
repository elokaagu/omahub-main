-- Explicitly fix Security Definer View warnings
-- Views in PostgreSQL don't actually support SECURITY DEFINER (only functions do)
-- This migration ensures views are completely clean and properly configured

-- 1. Completely remove and recreate leads_with_brand_details
DO $$
BEGIN
    -- Drop view and any dependencies
    DROP VIEW IF EXISTS public.leads_with_brand_details CASCADE;
    
    -- Verify tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
        
        -- Create view with explicit security settings
        CREATE VIEW public.leads_with_brand_details
        WITH (security_invoker = true)  -- Explicitly set to use invoker's permissions
        AS
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
          COALESCE(interactions.interaction_count, 0) as interaction_count,
          interactions.latest_interaction_date,
          interactions.latest_interaction_type,
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
        
        -- Grant permissions explicitly
        GRANT SELECT ON public.leads_with_brand_details TO authenticated;
        GRANT SELECT ON public.leads_with_brand_details TO anon;
        GRANT SELECT ON public.leads_with_brand_details TO service_role;
        
        -- Add comment
        COMMENT ON VIEW public.leads_with_brand_details IS 
            'View combining leads with brand details. Uses security_invoker=true to ensure proper RLS enforcement.';
        
        RAISE NOTICE 'Successfully recreated leads_with_brand_details view with security_invoker=true';
    ELSE
        RAISE WARNING 'Cannot create leads_with_brand_details: required tables (leads, brands) do not exist';
    END IF;
END $$;

-- 2. Completely remove and recreate reviews_with_details
DO $$
BEGIN
    -- Drop view and any dependencies
    DROP VIEW IF EXISTS public.reviews_with_details CASCADE;
    
    -- Verify tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
        
        -- Create view with explicit security settings
        CREATE VIEW public.reviews_with_details
        WITH (security_invoker = true)  -- Explicitly set to use invoker's permissions
        AS
        SELECT 
          r.id,
          r.brand_id,
          r.user_id,
          r.author,
          r.comment,
          r.rating,
          r.date,
          r.created_at,
          r.updated_at,
          b.name as brand_name,
          b.category as brand_category,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', rr.id,
                'reply_text', rr.reply_text,
                'admin_id', rr.admin_id,
                'admin_name', COALESCE(p.first_name || ' ' || p.last_name, p.email),
                'created_at', rr.created_at,
                'updated_at', rr.updated_at
              ) ORDER BY rr.created_at ASC
            ) FILTER (WHERE rr.id IS NOT NULL),
            '[]'::json
          ) as replies
        FROM public.reviews r
        LEFT JOIN public.brands b ON r.brand_id = b.id
        LEFT JOIN public.review_replies rr ON r.id = rr.review_id
        LEFT JOIN public.profiles p ON rr.admin_id = p.id
        GROUP BY r.id, r.brand_id, r.user_id, r.author, r.comment, r.rating, r.date, r.created_at, r.updated_at, b.name, b.category
        ORDER BY r.created_at DESC;
        
        -- Grant permissions explicitly
        GRANT SELECT ON public.reviews_with_details TO authenticated;
        GRANT SELECT ON public.reviews_with_details TO anon;
        GRANT SELECT ON public.reviews_with_details TO service_role;
        
        -- Add comment
        COMMENT ON VIEW public.reviews_with_details IS 
            'View combining reviews with brand details and replies. Uses security_invoker=true to ensure proper RLS enforcement.';
        
        RAISE NOTICE 'Successfully recreated reviews_with_details view with security_invoker=true';
    ELSE
        RAISE WARNING 'Cannot create reviews_with_details: required tables (reviews, brands) do not exist';
    END IF;
END $$;

-- 3. Verify views are created correctly
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public'
    AND viewname IN ('leads_with_brand_details', 'reviews_with_details')
ORDER BY viewname;

