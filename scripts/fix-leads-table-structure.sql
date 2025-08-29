-- Fix Leads Table Structure
-- This script updates the leads table to match the expected schema

-- First, let's check what columns currently exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add estimated_budget column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'estimated_budget'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN estimated_budget DECIMAL(10,2);
        RAISE NOTICE 'Added estimated_budget column';
    END IF;

    -- Add estimated_project_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'estimated_project_value'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN estimated_project_value DECIMAL(10,2);
        RAISE NOTICE 'Added estimated_project_value column';
    END IF;

    -- Add project_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN project_type VARCHAR(100);
        RAISE NOTICE 'Added project_type column';
    END IF;

    -- Add project_timeline column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'project_timeline'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN project_timeline VARCHAR(100);
        RAISE NOTICE 'Added project_timeline column';
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN location VARCHAR(255);
        RAISE NOTICE 'Added location column';
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;

    -- Add last_contact_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'last_contact_date'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN last_contact_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_contact_date column';
    END IF;

    -- Add next_follow_up_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'next_follow_up_date'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN next_follow_up_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added next_follow_up_date column';
    END IF;

    -- Add conversion_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'conversion_date'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN conversion_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added conversion_date column';
    END IF;

    -- Add inquiry_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'inquiry_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN inquiry_id UUID;
        RAISE NOTICE 'Added inquiry_id column';
    END IF;

    -- Add company_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN company_name VARCHAR(255);
        RAISE NOTICE 'Added company_name column';
    END IF;

    -- Add lead_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'lead_score'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN lead_score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added lead_score column';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
        RAISE NOTICE 'Added priority column';
    END IF;

END $$;

-- Show the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;

-- Test inserting a lead with the new structure
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
    'Test Lead After Fix',
    'test-after-fix@example.com',
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

-- Show the test lead
SELECT 
    id,
    customer_name,
    customer_email,
    lead_status,
    estimated_budget,
    project_type
FROM public.leads 
WHERE customer_email = 'test-after-fix@example.com';

-- Clean up test data
DELETE FROM public.leads WHERE customer_email = 'test-after-fix@example.com';

RAISE NOTICE 'Leads table structure fixed successfully!';
