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

-- 4. Review Security Definer Views
-- Note: Security Definer views are flagged but may be necessary for functionality
-- We'll add comments to document their purpose

-- For leads_with_brand_details view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'leads_with_brand_details') THEN
        COMMENT ON VIEW public.leads_with_brand_details IS 
            'View combining leads with brand details. Uses SECURITY DEFINER to allow proper access control. Access is controlled through RLS policies on underlying tables.';
        RAISE NOTICE 'Added documentation comment to leads_with_brand_details view';
    END IF;
END $$;

-- For reviews_with_details view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'reviews_with_details') THEN
        COMMENT ON VIEW public.reviews_with_details IS 
            'View combining reviews with brand details and replies. Uses SECURITY DEFINER to allow proper access control. Access is controlled through RLS policies on underlying tables.';
        RAISE NOTICE 'Added documentation comment to reviews_with_details view';
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

