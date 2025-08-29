-- Fix Designer Applications Table Structure and Permissions
-- Run this script directly in the Supabase SQL editor

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.designer_applications 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Enable Row Level Security
ALTER TABLE public.designer_applications ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing policies
DROP POLICY IF EXISTS "Super admins can manage all designer applications" ON public.designer_applications;
DROP POLICY IF EXISTS "Brand admins can view designer applications" ON public.designer_applications;
DROP POLICY IF EXISTS "Anyone can create designer applications" ON public.designer_applications;

-- Step 4: Create policy for SUPER ADMINS ONLY (no brand admins)
CREATE POLICY "Super admins can manage all designer applications" ON public.designer_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Step 5: Create policy for anyone to INSERT (for the join form)
CREATE POLICY "Anyone can create designer applications" ON public.designer_applications
    FOR INSERT WITH CHECK (true);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designer_applications_status ON public.designer_applications(status);
CREATE INDEX IF NOT EXISTS idx_designer_applications_created_at ON public.designer_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_designer_applications_category ON public.designer_applications(category);

-- Step 7: Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_designer_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_designer_applications_updated_at ON public.designer_applications;
CREATE TRIGGER update_designer_applications_updated_at
    BEFORE UPDATE ON public.designer_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_designer_applications_updated_at();

-- Step 9: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'designer_applications' 
ORDER BY ordinal_position;

-- Step 10: Verify RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'designer_applications';

-- Step 11: Test insert (optional - remove this after testing)
-- INSERT INTO public.designer_applications (
--     brand_name, 
--     designer_name, 
--     email, 
--     location, 
--     category, 
--     description,
--     notes
-- ) VALUES (
--     'Test Brand', 
--     'Test Designer', 
--     'test@example.com', 
--     'Test Location', 
--     'Test Category', 
--     'Test application with notes',
--     'This is a test note to verify the notes column works'
-- );

-- Step 12: Clean up test data (uncomment after testing)
-- DELETE FROM public.designer_applications WHERE email = 'test@example.com';
