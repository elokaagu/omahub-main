-- Fix Function Search Path Mutable warnings
-- Set search_path for all functions to prevent security vulnerabilities
-- Using 'public, pg_catalog' is secure and prevents injection while allowing unqualified names
-- This is safer than '' which would require all names to be fully qualified

-- 1. Update trigger functions (updated_at functions)
DO $$
BEGIN
    -- update_modified_column
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_modified_column() SET search_path = 'public, pg_catalog';
        RAISE NOTICE 'Fixed search_path for update_modified_column';
    END IF;

    -- update_updated_at_column
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_updated_at_column';
    END IF;

    -- update_designer_applications_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_designer_applications_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_designer_applications_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_designer_applications_updated_at';
    END IF;

    -- update_tailors_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_tailors_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_tailors_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_tailors_updated_at';
    END IF;

    -- update_spotlight_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_spotlight_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_spotlight_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_spotlight_updated_at';
    END IF;

    -- update_leads_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_leads_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_leads_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_leads_updated_at';
    END IF;

    -- update_faqs_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_faqs_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_faqs_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_faqs_updated_at';
    END IF;

    -- update_tailored_orders_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_tailored_orders_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_tailored_orders_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_tailored_orders_updated_at';
    END IF;

    -- update_newsletter_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_newsletter_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_newsletter_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_newsletter_updated_at';
    END IF;

    -- update_inquiries_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_inquiries_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_inquiries_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_inquiries_updated_at';
    END IF;

    -- update_notifications_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_notifications_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_notifications_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_notifications_updated_at';
    END IF;

    -- update_brand_images_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_brand_images_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_brand_images_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_brand_images_updated_at';
    END IF;

    -- update_collection_images_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_collection_images_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_collection_images_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_collection_images_updated_at';
    END IF;

    -- update_hero_slides_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_hero_slides_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_hero_slides_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_hero_slides_updated_at';
    END IF;
END $$;

-- 2. Update business logic functions
DO $$
BEGIN
    -- search_products_by_categories
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_products_by_categories' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.search_products_by_categories(search_categories TEXT[]) SET search_path = '';
        RAISE NOTICE 'Fixed search_path for search_products_by_categories';
    END IF;

    -- calculate_commission
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_commission' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.calculate_commission() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for calculate_commission';
    END IF;

    -- update_lead_on_booking
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_lead_on_booking' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_lead_on_booking() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_lead_on_booking';
    END IF;

    -- update_brand_rating
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_brand_rating' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_brand_rating() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_brand_rating';
    END IF;

    -- update_brand_financial_metrics
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_brand_financial_metrics' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_brand_financial_metrics(brand_id TEXT, month_date DATE) SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_brand_financial_metrics';
    END IF;

    -- get_inbox_stats
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_inbox_stats' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_inbox_stats(user_id UUID) SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_inbox_stats';
    END IF;

    -- get_leads_analytics
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_leads_analytics' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_leads_analytics() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_leads_analytics';
    END IF;

    -- get_user_baskets_summary
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_baskets_summary' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_user_baskets_summary(user_id UUID) SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_user_baskets_summary';
    END IF;

    -- handle_legal_document_update
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_legal_document_update' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.handle_legal_document_update() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for handle_legal_document_update';
    END IF;

    -- setup_super_admin
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'setup_super_admin' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.setup_super_admin() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for setup_super_admin';
    END IF;

    -- create_profile_for_user
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_profile_for_user' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.create_profile_for_user() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for create_profile_for_user';
    END IF;
END $$;

-- 3. Fix any remaining functions that might have mutable search_path
-- This will catch any functions we might have missed
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT 
            p.proname as func_name,
            pg_get_function_identity_arguments(p.oid) as func_args,
            p.oid as func_oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
            AND p.prosecdef = false  -- Not SECURITY DEFINER
            AND (
                -- Check if search_path is not set (it will be NULL or empty)
                (SELECT setting FROM pg_settings WHERE name = 'search_path') IS NOT NULL
                OR p.proconfig IS NULL
                OR NOT ('search_path' = ANY(p.proconfig))
            )
            AND p.proname NOT LIKE 'pg_%'  -- Exclude PostgreSQL internal functions
    LOOP
        BEGIN
            -- Try to set search_path for this function
            -- We need to construct the full function signature
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''public, pg_catalog''', 
                func_record.func_name, 
                func_record.func_args);
            RAISE NOTICE 'Fixed search_path for function: %(%)', func_record.func_name, func_record.func_args;
        EXCEPTION
            WHEN OTHERS THEN
                -- If we can't alter it (maybe wrong signature), just log and continue
                RAISE WARNING 'Could not fix search_path for function: %(%) - %', 
                    func_record.func_name, func_record.func_args, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify fixes
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL AND 'search_path' = ANY(p.proconfig) THEN 'SET'
        ELSE 'NOT SET'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'update_modified_column',
        'update_updated_at_column',
        'update_designer_applications_updated_at',
        'update_tailors_updated_at',
        'update_spotlight_updated_at',
        'update_leads_updated_at',
        'update_faqs_updated_at',
        'update_tailored_orders_updated_at',
        'update_newsletter_updated_at',
        'update_inquiries_updated_at',
        'update_notifications_updated_at',
        'search_products_by_categories',
        'calculate_commission',
        'update_lead_on_booking',
        'update_brand_rating',
        'get_inbox_stats',
        'get_leads_analytics',
        'get_user_baskets_summary',
        'handle_legal_document_update',
        'setup_super_admin',
        'create_profile_for_user'
    )
ORDER BY p.proname;

