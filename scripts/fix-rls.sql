-- First, check if RLS is enabled
SELECT relname as table_name, relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'brands';

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON public.brands;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.brands;

-- Enable RLS if not already enabled
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows everyone to read
CREATE POLICY "Enable read access for all users"
ON public.brands
FOR SELECT
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.brands TO authenticated;
GRANT SELECT ON public.brands TO anon;

-- Verify the policies
SELECT *
FROM pg_policies
WHERE tablename = 'brands'; 