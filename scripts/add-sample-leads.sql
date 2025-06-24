-- Add Sample Leads Data for Dashboard Display
-- This script adds diverse sample leads to demonstrate the LeadsTrackingDashboard functionality

-- First, let's get some brand IDs to use (or create sample brands if needed)
DO $$
DECLARE
    sample_brand_1 UUID;
    sample_brand_2 UUID;
    sample_brand_3 UUID;
    sample_brand_4 UUID;
BEGIN
    -- Get existing brand IDs or create sample brands
    SELECT id INTO sample_brand_1 FROM brands LIMIT 1;
    
    IF sample_brand_1 IS NULL THEN
        -- Create sample brands if none exist
        INSERT INTO brands (name, category, description, location, image, created_at)
        VALUES 
            ('Adunni Couture', 'Fashion', 'Premium Nigerian fashion house specializing in contemporary African wear', 'Lagos, Nigeria', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100', NOW()),
            ('Kemi Beauty Studio', 'Beauty', 'Professional makeup and beauty services for special occasions', 'Abuja, Nigeria', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100', NOW()),
            ('Tolu Photography', 'Photography', 'Wedding and event photography with artistic flair', 'Lagos, Nigeria', 'https://images.unsplash.com/photo-1554048612-b6ebae92138d?w=100', NOW()),
            ('Eko Catering Co', 'Catering', 'Authentic Nigerian cuisine for events and celebrations', 'Lagos, Nigeria', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100', NOW())
        RETURNING id INTO sample_brand_1;
        
        -- Get the other brand IDs
        SELECT id INTO sample_brand_2 FROM brands WHERE name = 'Kemi Beauty Studio';
        SELECT id INTO sample_brand_3 FROM brands WHERE name = 'Tolu Photography';
        SELECT id INTO sample_brand_4 FROM brands WHERE name = 'Eko Catering Co';
    ELSE
        -- Use existing brands
        SELECT id INTO sample_brand_2 FROM brands OFFSET 1 LIMIT 1;
        SELECT id INTO sample_brand_3 FROM brands OFFSET 2 LIMIT 1;
        SELECT id INTO sample_brand_4 FROM brands OFFSET 3 LIMIT 1;
        
        -- Fallback to first brand if not enough brands exist
        sample_brand_2 := COALESCE(sample_brand_2, sample_brand_1);
        sample_brand_3 := COALESCE(sample_brand_3, sample_brand_1);
        sample_brand_4 := COALESCE(sample_brand_4, sample_brand_1);
    END IF;

    -- Clear existing sample leads to avoid duplicates
    DELETE FROM leads WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com';

    -- Insert diverse sample leads
    INSERT INTO leads (
        brand_id, customer_name, customer_email, customer_phone,
        source, lead_type, status, priority, estimated_value, notes,
        created_at, updated_at, contacted_at, qualified_at, converted_at
    ) VALUES 
    -- Recent leads (this month)
    (sample_brand_1, 'Funmi Adebayo', 'funmi.adebayo@example.com', '+234-803-123-4567',
     'instagram', 'quote_request', 'new', 'high', 150000.00, 
     'Interested in custom wedding dress for December ceremony',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL),
     
    (sample_brand_2, 'Chioma Okafor', 'chioma.okafor@example.com', '+234-805-987-6543',
     'website', 'booking_intent', 'contacted', 'urgent', 75000.00,
     'Bridal makeup for wedding next month, needs trial session',
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL),
     
    (sample_brand_3, 'David Johnson', 'david.johnson@example.com', '+234-807-456-7890',
     'referral', 'consultation', 'qualified', 'high', 200000.00,
     'Pre-wedding and wedding photography package, referred by previous client',
     NOW() - INTERVAL '1 week', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NULL),
     
    (sample_brand_4, 'Amina Hassan', 'amina.hassan@example.com', '+234-809-234-5678',
     'whatsapp', 'inquiry', 'converted', 'normal', 120000.00,
     'Traditional wedding catering for 200 guests',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'),
     
    (sample_brand_1, 'Grace Emeka', 'grace.emeka@example.com', '+234-806-345-6789',
     'email', 'product_interest', 'contacted', 'normal', 85000.00,
     'Looking for Ankara outfit for corporate event',
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL),

    -- Older leads (last month and beyond)
    (sample_brand_2, 'Blessing Okoro', 'blessing.okoro@sample.com', '+234-808-567-8901',
     'phone', 'booking_intent', 'converted', 'high', 95000.00,
     'Birthday photoshoot and makeup package',
     NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2.5 weeks', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
     
    (sample_brand_3, 'Michael Ade', 'michael.ade@sample.com', '+234-804-678-9012',
     'direct', 'consultation', 'lost', 'low', 180000.00,
     'Engagement shoot, client went with another photographer',
     NOW() - INTERVAL '1 month', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks', NULL, NULL),
     
    (sample_brand_4, 'Fatima Bello', 'fatima.bello@sample.com', '+234-802-789-0123',
     'instagram', 'quote_request', 'qualified', 'normal', 250000.00,
     'Corporate event catering, pending final approval',
     NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '1 week', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 week', NULL),
     
    (sample_brand_1, 'Kemi Afolabi', 'kemi.afolabi@sample.com', '+234-807-890-1234',
     'referral', 'inquiry', 'closed', 'low', 60000.00,
     'Casual wear inquiry, completed purchase in-store',
     NOW() - INTERVAL '5 weeks', NOW() - INTERVAL '4 weeks', NOW() - INTERVAL '4 weeks', NOW() - INTERVAL '4 weeks', NOW() - INTERVAL '4 weeks'),
     
    (sample_brand_2, 'Ola Adeyemi', 'ola.adeyemi@sample.com', '+234-805-901-2345',
     'website', 'consultation', 'new', 'normal', 45000.00,
     'Makeup consultation for professional headshots',
     NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '6 weeks', NULL, NULL, NULL),

    -- Additional leads for better analytics
    (sample_brand_3, 'Jennifer Okwu', 'jennifer.okwu@sample.com', '+234-803-012-3456',
     'whatsapp', 'booking_intent', 'converted', 'high', 300000.00,
     'Full wedding photography package including drone shots',
     NOW() - INTERVAL '2 months', NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '7 weeks', NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '6 weeks'),
     
    (sample_brand_4, 'Samuel Ogun', 'samuel.ogun@sample.com', '+234-806-123-4567',
     'email', 'quote_request', 'contacted', 'normal', 180000.00,
     'Birthday party catering for 150 guests',
     NOW() - INTERVAL '1 week', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, NULL),
     
    (sample_brand_1, 'Adaora Nkem', 'adaora.nkem@sample.com', '+234-808-234-5678',
     'instagram', 'product_interest', 'qualified', 'high', 220000.00,
     'Custom Aso-ebi for wedding party of 8 people',
     NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL),
     
    (sample_brand_2, 'Tunde Fashola', 'tunde.fashola@sample.com', '+234-804-345-6789',
     'referral', 'consultation', 'lost', 'low', 35000.00,
     'Groom grooming package, decided to go with hotel spa instead',
     NOW() - INTERVAL '3 months', NOW() - INTERVAL '2.5 months', NOW() - INTERVAL '2.5 months', NULL, NULL),
     
    (sample_brand_3, 'Ngozi Ike', 'ngozi.ike@sample.com', '+234-807-456-7890',
     'direct', 'inquiry', 'contacted', 'normal', 125000.00,
     'Family portrait session for holiday cards',
     NOW() - INTERVAL '1 week', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL, NULL);

    -- Add some lead interactions for realism
    INSERT INTO lead_interactions (lead_id, interaction_type, interaction_date, description, admin_id)
    SELECT 
        l.id,
        CASE 
            WHEN l.status = 'contacted' THEN 'phone'
            WHEN l.status = 'qualified' THEN 'quote_sent'
            WHEN l.status = 'converted' THEN 'meeting'
            ELSE 'email'
        END,
        l.contacted_at,
        CASE 
            WHEN l.status = 'contacted' THEN 'Initial contact made, discussed requirements'
            WHEN l.status = 'qualified' THEN 'Sent detailed quote and package options'
            WHEN l.status = 'converted' THEN 'Final meeting completed, booking confirmed'
            ELSE 'Follow-up email sent with portfolio'
        END,
        (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1)
    FROM leads l
    WHERE l.contacted_at IS NOT NULL
    AND l.customer_email LIKE '%@example.com' OR l.customer_email LIKE '%@sample.com';

    -- Create some sample bookings for converted leads
    INSERT INTO bookings (
        lead_id, brand_id, customer_name, customer_email, booking_type,
        booking_date, booking_value, commission_rate, commission_amount,
        status, created_at
    )
    SELECT 
        l.id,
        l.brand_id,
        l.customer_name,
        l.customer_email,
        CASE l.lead_type
            WHEN 'booking_intent' THEN 'service'
            WHEN 'consultation' THEN 'consultation'
            ELSE 'product'
        END,
        l.converted_at + INTERVAL '1 week',
        l.estimated_value,
        15.0, -- 15% commission rate
        l.estimated_value * 0.15,
        'confirmed',
        l.converted_at
    FROM leads l
    WHERE l.status = 'converted'
    AND (l.customer_email LIKE '%@example.com' OR l.customer_email LIKE '%@sample.com');

    RAISE NOTICE 'Sample leads data added successfully!';
    RAISE NOTICE 'Total leads created: %', (SELECT COUNT(*) FROM leads WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com');
    RAISE NOTICE 'Total bookings created: %', (SELECT COUNT(*) FROM bookings WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com');
END $$;

-- Verify the data was created
SELECT 
    'Sample Data Summary' as info,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
    COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
    COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
    COUNT(*) FILTER (WHERE status = 'lost') as lost_leads,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_leads
FROM leads 
WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com';

-- Show leads by source
SELECT 
    'Leads by Source' as info,
    source,
    COUNT(*) as count
FROM leads 
WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com'
GROUP BY source
ORDER BY count DESC;

-- Show leads by brand
SELECT 
    'Leads by Brand' as info,
    b.name as brand_name,
    COUNT(l.*) as lead_count,
    AVG(l.estimated_value) as avg_value
FROM leads l
JOIN brands b ON l.brand_id = b.id
WHERE l.customer_email LIKE '%@example.com' OR l.customer_email LIKE '%@sample.com'
GROUP BY b.name, b.id
ORDER BY lead_count DESC; 