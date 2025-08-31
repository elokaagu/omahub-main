-- Add OmaHub Platform Brand for General Inquiries
-- This brand will be used for general platform contact form submissions

-- Insert OmaHub as a special brand for platform-level inquiries
INSERT INTO brands (
    id, 
    name, 
    description, 
    long_description,
    location, 
    price_range, 
    category, 
    rating, 
    is_verified, 
    image, 
    contact_email,
    created_at
) VALUES (
    'omahub-platform-0000-0000-0000-000000000000',
    'OmaHub Platform',
    'Platform-level inquiries and general contact form submissions',
    'OmaHub Platform handles general inquiries, feedback, and support requests that are not specific to individual designer brands. This includes general questions about the platform, partnership opportunities, and general customer service inquiries.',
    'Platform-wide',
    'N/A',
    'Platform',
    5.0,
    TRUE,
    NULL,
    'info@oma-hub.com',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    long_description = EXCLUDED.long_description,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- Verify the brand was created
SELECT 
    '✅ OmaHub Platform brand created/updated successfully' as status,
    id,
    name,
    contact_email,
    created_at
FROM brands 
WHERE id = 'omahub-platform-0000-0000-0000-000000000000';
