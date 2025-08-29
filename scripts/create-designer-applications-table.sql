-- Create designer applications table for studio integration
-- This replaces the Airtable dependency with a proper database table

-- Step 1: Create the designer_applications table
CREATE TABLE IF NOT EXISTS public.designer_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_name TEXT NOT NULL,
    designer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    instagram TEXT,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    year_founded INTEGER,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add RLS policies for security
ALTER TABLE public.designer_applications ENABLE ROW LEVEL SECURITY;

-- Super admins can view and manage all applications
CREATE POLICY "Super admins can manage all designer applications" ON public.designer_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Brand admins can view applications (read-only)
CREATE POLICY "Brand admins can view designer applications" ON public.designer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'brand_admin')
        )
    );

-- Anyone can create applications (for the join form)
CREATE POLICY "Anyone can create designer applications" ON public.designer_applications
    FOR INSERT WITH CHECK (true);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designer_applications_status ON public.designer_applications(status);
CREATE INDEX IF NOT EXISTS idx_designer_applications_created_at ON public.designer_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_designer_applications_category ON public.designer_applications(category);

-- Step 4: Add comments for documentation
COMMENT ON TABLE public.designer_applications IS 'Designer applications submitted through the join form, managed in the studio';
COMMENT ON COLUMN public.designer_applications.status IS 'Application status: new, reviewing, approved, rejected';
COMMENT ON COLUMN public.designer_applications.notes IS 'Internal notes for admins reviewing applications';
COMMENT ON COLUMN public.designer_applications.reviewed_by IS 'User ID of the admin who reviewed the application';

-- Step 5: Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_designer_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update updated_at
CREATE TRIGGER update_designer_applications_updated_at
    BEFORE UPDATE ON public.designer_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_designer_applications_updated_at();

-- Step 7: Insert some sample data for testing (optional)
-- INSERT INTO public.designer_applications (brand_name, designer_name, email, location, category, description) VALUES
-- ('Sample Brand', 'Sample Designer', 'sample@example.com', 'London', 'Bridal', 'Sample application for testing');

-- Step 8: Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'designer_applications' 
ORDER BY ordinal_position;
