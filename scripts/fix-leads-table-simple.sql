-- SIMPLE Leads Table Fix - Run this step by step
-- Copy and paste each section separately into your Supabase SQL editor

-- ========================================
-- STEP 1: Check current table structure
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: Add missing columns one by one
-- ========================================

-- Add estimated_budget column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS estimated_budget DECIMAL(10,2);

-- Add estimated_project_value column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS estimated_project_value DECIMAL(10,2);

-- Add project_type column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);

-- Add project_timeline column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS project_timeline VARCHAR(100);

-- Add location column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add notes column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add tags column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add last_contact_date column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;

-- Add next_follow_up_date column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE;

-- Add conversion_date column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE;

-- Add inquiry_id column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS inquiry_id UUID;

-- Add company_name column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add lead_score column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- Add priority column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- ========================================
-- STEP 3: Verify the updated structure
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;

-- ========================================
-- STEP 4: Test creating a lead
-- ========================================
INSERT INTO public.leads (
    brand_id,
    customer_name,
    customer_email,
    customer_phone,
    lead_source,
    lead_status,
    lead_score,
    priority,
    estimated_budget,
    project_type,
    project_timeline,
    notes
) VALUES (
    (SELECT id FROM public.brands LIMIT 1),
    'Test Lead',
    'test-lead@example.com',
    '+1234567890',
    'contact_form',
    'new',
    50,
    'medium',
    2500.00,
    'custom_clothing',
    '3-6 months',
    'Test lead created after fixing table structure'
);

-- ========================================
-- STEP 5: Verify the test lead was created
-- ========================================
SELECT 
    id,
    customer_name,
    customer_email,
    lead_status,
    estimated_budget,
    project_type
FROM public.leads 
WHERE customer_email = 'test-lead@example.com';

-- ========================================
-- STEP 6: Clean up test data
-- ========================================
DELETE FROM public.leads WHERE customer_email = 'test-lead@example.com';

-- ========================================
-- STEP 7: Final verification
-- ========================================
SELECT 'Leads table structure fixed successfully!' as status;
