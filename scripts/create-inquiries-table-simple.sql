-- Create inquiries table for contact form submissions
-- This is required for the contact API to work

-- Check if table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inquiries') THEN
        -- Create inquiries table
        CREATE TABLE public.inquiries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50),
            subject VARCHAR(500) NOT NULL,
            message TEXT NOT NULL,
            inquiry_type VARCHAR(50) DEFAULT 'customer_inquiry',
            priority VARCHAR(20) DEFAULT 'normal',
            source VARCHAR(50) DEFAULT 'website_contact_form',
            status VARCHAR(20) DEFAULT 'new',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX idx_inquiries_brand_id ON public.inquiries(brand_id);
        CREATE INDEX idx_inquiries_status ON public.inquiries(status);
        CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at DESC);
        CREATE INDEX idx_inquiries_customer_email ON public.inquiries(customer_email);

        -- Enable RLS
        ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        -- Allow anyone to create inquiries (for contact forms)
        CREATE POLICY "Anyone can create inquiries" ON public.inquiries
            FOR INSERT WITH CHECK (true);

        -- Allow brand owners to view inquiries for their brands
        CREATE POLICY "Brand owners can view their inquiries" ON public.inquiries
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND (
                        profiles.role::text IN ('admin', 'super_admin')
                        OR (profiles.role::text = 'brand_admin' AND inquiries.brand_id = ANY(profiles.owned_brands))
                    )
                )
            );

        -- Allow brand owners to update inquiry status
        CREATE POLICY "Brand owners can update their inquiries" ON public.inquiries
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND (
                        profiles.role::text IN ('admin', 'super_admin')
                        OR (profiles.role::text = 'brand_admin' AND inquiries.brand_id = ANY(profiles.owned_brands))
                    )
                )
            );

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE ON public.inquiries TO authenticated;
        GRANT SELECT, INSERT, UPDATE ON public.inquiries TO anon;

        RAISE NOTICE 'Inquiries table created successfully';
    ELSE
        RAISE NOTICE 'Inquiries table already exists';
    END IF;
END $$;

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'inquiries'
ORDER BY ordinal_position;
