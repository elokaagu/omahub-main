-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create policy to enable read access for all users
CREATE POLICY "Enable read access for all users"
ON public.brands
FOR SELECT
USING (true);

-- Create policy to enable read access for authenticated users (optional, if you want to restrict to authenticated users only)
CREATE POLICY "Enable read access for authenticated users"
ON public.brands
FOR SELECT
USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON public.brands TO authenticated;
GRANT SELECT ON public.brands TO anon;

-- Verify if there's data in the brands table
SELECT COUNT(*) as brand_count FROM public.brands; 