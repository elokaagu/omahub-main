-- Fix Inquiries Table Constraints
-- This script updates the inquiries table to allow the values that contact forms are trying to insert

-- 1. Update inquiry_type constraint to allow more values
ALTER TABLE public.inquiries 
DROP CONSTRAINT IF EXISTS inquiries_inquiry_type_check;

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_inquiry_type_check 
CHECK (inquiry_type IN ('general', 'custom_order', 'product_question', 'collaboration', 'wholesale', 'customer_inquiry', 'platform_contact'));

-- 2. Update source constraint to allow more values
ALTER TABLE public.inquiries 
DROP CONSTRAINT IF EXISTS inquiries_source_check;

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_source_check 
CHECK (source IN ('website', 'whatsapp', 'instagram', 'email', 'phone', 'platform_contact_form'));

-- 3. Update status constraint to allow 'new' status
ALTER TABLE public.inquiries 
DROP CONSTRAINT IF EXISTS inquiries_status_check;

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_status_check 
CHECK (status IN ('unread', 'read', 'replied', 'closed', 'new'));

-- 4. Verify the changes
SELECT 
    'Inquiries Table Constraints Updated' as status,
    'Contact forms should now be able to create inquiries' as message;

-- 5. Test if we can insert a sample inquiry
INSERT INTO public.inquiries (
    brand_id,
    customer_name,
    customer_email,
    subject,
    message,
    inquiry_type,
    status,
    priority,
    source
) VALUES (
    'omahub-platform-0000-0000-0000-000000000000',
    'Test User',
    'test@example.com',
    'Test Inquiry',
    'This is a test inquiry to verify constraints are working',
    'platform_contact',
    'new',
    'normal',
    'platform_contact_form'
) ON CONFLICT DO NOTHING;

-- 6. Clean up the test data
DELETE FROM public.inquiries 
WHERE customer_email = 'test@example.com' 
AND subject = 'Test Inquiry';

SELECT 
    '✅ Inquiries table constraints fixed successfully' as result,
    'Contact forms should now create inquiries properly' as next_step;
