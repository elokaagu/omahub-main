-- Fix Designer Applications Status Constraint
-- Run this script directly in the Supabase SQL editor

-- Step 1: Drop the existing status constraint
ALTER TABLE public.designer_applications 
DROP CONSTRAINT IF EXISTS designer_applications_status_check;

-- Step 2: Add the correct status constraint
ALTER TABLE public.designer_applications 
ADD CONSTRAINT designer_applications_status_check 
CHECK (status IN ('new', 'reviewing', 'approved', 'rejected'));

-- Step 3: Verify the constraint was added
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.designer_applications'::regclass 
AND contype = 'c';

-- Step 4: Test the constraint with a valid status
INSERT INTO public.designer_applications (
    brand_name, 
    designer_name, 
    email, 
    location, 
    category, 
    description,
    status
) VALUES (
    'Test Brand', 
    'Test Designer', 
    'test@example.com', 
    'Test Location', 
    'Test Category', 
    'Test application',
    'new'
);

-- Step 5: Clean up test data
DELETE FROM public.designer_applications WHERE email = 'test@example.com';

-- Step 6: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'designer_applications' 
ORDER BY ordinal_position;
