-- Fix RLS Security Issues
-- Enable Row Level Security on tables that are missing it

-- 1. Enable RLS on featured_tailors table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_tailors') THEN
        ALTER TABLE public.featured_tailors ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public read access to featured_tailors" ON public.featured_tailors;
        DROP POLICY IF EXISTS "Allow authenticated users to manage featured_tailors" ON public.featured_tailors;
        
        -- Create read-only policy for public
        CREATE POLICY "Allow public read access to featured_tailors"
        ON public.featured_tailors FOR SELECT
        TO public
        USING (true);
        
        -- Create policy for authenticated users (admins only)
        CREATE POLICY "Allow authenticated users to manage featured_tailors"
        ON public.featured_tailors FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('super_admin', 'brand_admin')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('super_admin', 'brand_admin')
            )
        );
        
        -- Service role can do everything
        DROP POLICY IF EXISTS "Service role can manage featured_tailors" ON public.featured_tailors;
        CREATE POLICY "Service role can manage featured_tailors"
        ON public.featured_tailors FOR ALL
        TO service_role
        USING (true);
        
        RAISE NOTICE 'RLS enabled on featured_tailors table';
    ELSE
        RAISE NOTICE 'featured_tailors table does not exist, skipping';
    END IF;
END $$;

-- 2. Enable RLS on platform_settings table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings') THEN
        ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public read access to platform_settings" ON public.platform_settings;
        DROP POLICY IF EXISTS "Allow authenticated users to manage platform_settings" ON public.platform_settings;
        
        -- Create read-only policy for public (settings are usually public)
        CREATE POLICY "Allow public read access to platform_settings"
        ON public.platform_settings FOR SELECT
        TO public
        USING (true);
        
        -- Create policy for authenticated users (super admins only for settings)
        CREATE POLICY "Allow authenticated users to manage platform_settings"
        ON public.platform_settings FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role = 'super_admin'
            )
        );
        
        -- Service role can do everything
        DROP POLICY IF EXISTS "Service role can manage platform_settings" ON public.platform_settings;
        CREATE POLICY "Service role can manage platform_settings"
        ON public.platform_settings FOR ALL
        TO service_role
        USING (true);
        
        RAISE NOTICE 'RLS enabled on platform_settings table';
    ELSE
        RAISE NOTICE 'platform_settings table does not exist, skipping';
    END IF;
END $$;

-- 3. Enable RLS on brand_image_assignments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_image_assignments') THEN
        ALTER TABLE public.brand_image_assignments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public read access to brand_image_assignments" ON public.brand_image_assignments;
        DROP POLICY IF EXISTS "Allow authenticated users to manage brand_image_assignments" ON public.brand_image_assignments;
        
        -- Create read-only policy for public
        CREATE POLICY "Allow public read access to brand_image_assignments"
        ON public.brand_image_assignments FOR SELECT
        TO public
        USING (true);
        
        -- Create policy for authenticated users (admins and brand owners)
        CREATE POLICY "Allow authenticated users to manage brand_image_assignments"
        ON public.brand_image_assignments FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND (
                    role = 'super_admin' 
                    OR (role = 'brand_admin' AND brand_id = ANY(owned_brands))
                )
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND (
                    role = 'super_admin' 
                    OR (role = 'brand_admin' AND brand_id = ANY(owned_brands))
                )
            )
        );
        
        -- Service role can do everything
        DROP POLICY IF EXISTS "Service role can manage brand_image_assignments" ON public.brand_image_assignments;
        CREATE POLICY "Service role can manage brand_image_assignments"
        ON public.brand_image_assignments FOR ALL
        TO service_role
        USING (true);
        
        RAISE NOTICE 'RLS enabled on brand_image_assignments table';
    ELSE
        RAISE NOTICE 'brand_image_assignments table does not exist, skipping';
    END IF;
END $$;

-- 4. Recreate views without SECURITY DEFINER (views don't need it, only functions do)
-- These are regular SELECT views that should work with RLS on underlying tables

-- Recreate leads_with_brand_details view (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'leads_with_brand_details') THEN
        -- Drop and recreate to ensure it's not marked as SECURITY DEFINER
        DROP VIEW IF EXISTS public.leads_with_brand_details CASCADE;
        
        CREATE VIEW public.leads_with_brand_details AS
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
        
        -- Grant permissions
        GRANT SELECT ON public.leads_with_brand_details TO authenticated;
        GRANT SELECT ON public.leads_with_brand_details TO anon;
        
        COMMENT ON VIEW public.leads_with_brand_details IS 
            'View combining leads with brand details. Access is controlled through RLS policies on underlying tables.';
        
        RAISE NOTICE 'Recreated leads_with_brand_details view without SECURITY DEFINER';
    ELSE
        RAISE NOTICE 'leads_with_brand_details view does not exist, skipping';
    END IF;
END $$;

-- Recreate reviews_with_details view (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'reviews_with_details') THEN
        -- Drop and recreate to ensure it's not marked as SECURITY DEFINER
        DROP VIEW IF EXISTS public.reviews_with_details CASCADE;
        
        CREATE VIEW public.reviews_with_details AS
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
        
        -- Grant permissions
        GRANT SELECT ON public.reviews_with_details TO authenticated;
        GRANT SELECT ON public.reviews_with_details TO anon;
        
        COMMENT ON VIEW public.reviews_with_details IS 
            'View combining reviews with brand details and replies. Access is controlled through RLS policies on underlying tables.';
        
        RAISE NOTICE 'Recreated reviews_with_details view without SECURITY DEFINER';
    ELSE
        RAISE NOTICE 'reviews_with_details view does not exist, skipping';
    END IF;
END $$;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('featured_tailors', 'platform_settings', 'brand_image_assignments')
ORDER BY tablename;

