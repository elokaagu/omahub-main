-- Diagnose Studio Inbox Issue
-- This script checks why contact form messages aren't appearing in Studio Inbox

-- 1. Check if inquiries table exists
SELECT 
    'Table Existence Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inquiries') 
        THEN '✅ Inquiries table exists'
        ELSE '❌ Inquiries table missing'
    END as result;

-- 2. Check if OmaHub Platform brand exists
SELECT 
    'OmaHub Platform Brand Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM brands WHERE id = 'omahub-platform-0000-0000-0000-000000000000') 
        THEN '✅ OmaHub Platform brand exists'
        ELSE '❌ OmaHub Platform brand missing - run add-omahub-brand.sql first'
    END as result,
    id,
    name,
    contact_email
FROM brands 
WHERE id = 'omahub-platform-0000-0000-0000-000000000000';

-- 3. Check total count of inquiries
SELECT 
    'Inquiries Count Check' as check_type,
    COUNT(*) as total_inquiries,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Inquiries exist in database'
        ELSE '❌ No inquiries in database'
    END as result
FROM inquiries;

-- 4. Check recent inquiries with full details
SELECT 
    'Recent Inquiries Details' as check_type,
    i.id,
    i.customer_name,
    i.customer_email,
    i.subject,
    i.message,
    i.inquiry_type,
    i.status,
    i.source,
    i.brand_id,
    i.created_at,
    b.name as brand_name
FROM inquiries i
LEFT JOIN brands b ON i.brand_id = b.id
ORDER BY i.created_at DESC
LIMIT 5;

-- 5. Check for any constraint violations or errors
SELECT 
    'Constraint Violation Check' as check_type,
    inquiry_type,
    source,
    status,
    COUNT(*) as count
FROM inquiries
GROUP BY inquiry_type, source, status;

-- 6. Check if there are any leads that should have corresponding inquiries
SELECT 
    'Leads vs Inquiries Check' as check_type,
    COUNT(l.id) as total_leads,
    COUNT(i.id) as total_inquiries,
    CASE 
        WHEN COUNT(l.id) > COUNT(i.id) THEN '⚠️ More leads than inquiries - some may be missing'
        WHEN COUNT(l.id) = COUNT(i.id) THEN '✅ Leads and inquiries count match'
        ELSE '❌ More inquiries than leads - unexpected'
    END as result
FROM leads l
LEFT JOIN inquiries i ON l.customer_email = i.customer_email AND l.created_at::date = i.created_at::date;

-- 7. Check specific contact form submissions
SELECT 
    'Contact Form Check' as check_type,
    l.id as lead_id,
    l.customer_name,
    l.customer_email,
    l.source,
    l.created_at as lead_created,
    i.id as inquiry_id,
    i.created_at as inquiry_created,
    CASE 
        WHEN i.id IS NULL THEN '❌ Lead exists but no inquiry'
        ELSE '✅ Both lead and inquiry exist'
    END as status
FROM leads l
LEFT JOIN inquiries i ON l.customer_email = i.customer_email 
    AND ABS(EXTRACT(EPOCH FROM (l.created_at - i.created_at))) < 60 -- Within 1 minute
WHERE l.source IN ('website', 'platform_contact_form')
ORDER BY l.created_at DESC
LIMIT 10;

-- 8. Check database schema for inquiries table
SELECT 
    'Schema Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inquiries' 
ORDER BY ordinal_position;

-- 9. Summary and recommendations
SELECT 
    'Diagnosis Summary' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inquiries') 
        THEN '❌ Inquiries table does not exist - run fix-inbox-system-complete.sql'
        WHEN NOT EXISTS (SELECT 1 FROM brands WHERE id = 'omahub-platform-0000-0000-0000-000000000000') 
        THEN '❌ OmaHub Platform brand missing - run add-omahub-brand.sql'
        WHEN NOT EXISTS (SELECT 1 FROM inquiries) 
        THEN '⚠️ Inquiries table exists but empty - submit a contact form to test'
        ELSE '✅ System appears ready - check API logs for filtering issues'
    END as recommendation;
