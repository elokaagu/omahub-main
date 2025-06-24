-- Create inquiries table for contact messages
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'closed')),
    source VARCHAR(50) DEFAULT 'contact_form',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON inquiries(customer_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Brand owners can see inquiries for their brands
CREATE POLICY "Brand owners can view their inquiries" ON inquiries
    FOR SELECT USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

-- Brand owners can update inquiries for their brands
CREATE POLICY "Brand owners can update their inquiries" ON inquiries
    FOR UPDATE USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

-- Anyone can create inquiries (for contact forms)
CREATE POLICY "Anyone can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (true);

-- Super admins can do everything
CREATE POLICY "Super admins can manage all inquiries" ON inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON inquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON inquiries TO anon; -- Allow anonymous users to submit contact forms

-- Add comments for documentation
COMMENT ON TABLE inquiries IS 'Stores customer inquiries and contact messages for brands';
COMMENT ON COLUMN inquiries.inquiry_type IS 'Type of inquiry: general, pricing, availability, etc.';
COMMENT ON COLUMN inquiries.priority IS 'Priority level: low, normal, high';
COMMENT ON COLUMN inquiries.status IS 'Status: unread, read, replied, closed';
COMMENT ON COLUMN inquiries.source IS 'Source of inquiry: contact_form, phone, email, etc.'; 