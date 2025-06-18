-- Database Performance Optimizations for OmaHub
-- Run these commands individually or in autocommit mode

-- 1. Additional indexes for better query performance
-- Note: Remove CONCURRENTLY if running in a transaction block

-- Brands performance indexes
CREATE INDEX IF NOT EXISTS idx_brands_category_status 
ON public.brands(category, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_brands_verified_name 
ON public.brands(name) 
WHERE verified = true;

-- Products performance indexes  
CREATE INDEX IF NOT EXISTS idx_products_brand_category 
ON public.products(brand_id, category);

CREATE INDEX IF NOT EXISTS idx_products_featured_created 
ON public.products(created_at DESC) 
WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_products_price_range 
ON public.products(price) 
WHERE price IS NOT NULL;

-- Reviews performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_rating_created 
ON public.reviews(rating, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
ON public.reviews(product_id, rating);

-- Inquiries performance indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inquiries') THEN
        CREATE INDEX IF NOT EXISTS idx_inquiries_status_priority 
        ON public.inquiries(status, priority, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_inquiries_brand_status 
        ON public.inquiries(brand_id, status);
        
        CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email_brand 
        ON public.inquiries(customer_email, brand_id);
    END IF;
END $$;

-- Profiles performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_brands 
ON public.profiles(role, owned_brands);

CREATE INDEX IF NOT EXISTS idx_profiles_email_role 
ON public.profiles(email, role);

-- 2. Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_brand_status_featured 
ON public.products(brand_id, status, featured) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reviews_product_created 
ON public.reviews(product_id, created_at DESC);

-- 3. Partial indexes for specific use cases
CREATE INDEX IF NOT EXISTS idx_products_active_with_images 
ON public.products(created_at DESC) 
WHERE status = 'active' AND images IS NOT NULL AND images != '[]';

CREATE INDEX IF NOT EXISTS idx_brands_active_verified 
ON public.brands(created_at DESC) 
WHERE status = 'active' AND verified = true;

-- 4. Add search optimization indexes (if columns exist)
DO $$
BEGIN
    -- Check if search columns exist before creating indexes
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'search_vector') THEN
        CREATE INDEX IF NOT EXISTS idx_products_search_gin 
        ON public.products USING GIN(search_vector);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'brands' AND column_name = 'search_vector') THEN
        CREATE INDEX IF NOT EXISTS idx_brands_search_gin 
        ON public.brands USING GIN(search_vector);
    END IF;
END $$;

-- 5. Performance monitoring queries
-- Use these to check index usage and performance

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes and index sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (if pg_stat_statements is enabled)
-- SELECT query, calls, total_time, mean_time, rows 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

SELECT 'Database performance optimizations completed successfully!' as status; 