-- Populate database with realistic sample data for testing
-- This script creates sample brands, inquiries, and leads

-- First, let's create some sample brands if they don't exist
INSERT INTO brands (id, name, description, style, location, price_range, contact_email, contact_phone, website, instagram, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Elegant Blooms Studio', 'Luxury floral design for weddings and special events', 'modern', 'New York, NY', 'luxury', 'hello@elegantblooms.com', '+1-212-555-0101', 'https://elegantblooms.com', '@elegantblooms', NOW() - INTERVAL '6 months'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Rustic Rose Designs', 'Bohemian and rustic wedding florals with organic charm', 'bohemian', 'Austin, TX', 'mid-range', 'info@rusticrosedesigns.com', '+1-512-555-0102', 'https://rusticrosedesigns.com', '@rusticrosedesigns', NOW() - INTERVAL '4 months'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Metropolitan Florals', 'Contemporary corporate and event floral arrangements', 'contemporary', 'Chicago, IL', 'luxury', 'contact@metropolitanflorals.com', '+1-312-555-0103', 'https://metropolitanflorals.com', '@metropolitanflorals', NOW() - INTERVAL '8 months'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Garden Party Co.', 'Whimsical garden-style arrangements for intimate celebrations', 'romantic', 'San Francisco, CA', 'affordable', 'hello@gardenpartyco.com', '+1-415-555-0104', 'https://gardenpartyco.com', '@gardenpartyco', NOW() - INTERVAL '3 months'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Bloom & Vine Studio', 'Artisanal floral design with sustainable practices', 'modern', 'Portland, OR', 'mid-range', 'studio@bloomandvine.com', '+1-503-555-0105', 'https://bloomandvine.com', '@bloomandvine', NOW() - INTERVAL '5 months')
ON CONFLICT (id) DO NOTHING;

-- Create sample inquiries
INSERT INTO inquiries (id, brand_id, customer_name, customer_email, subject, message, inquiry_type, priority, status, source, created_at)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'sarah.johnson@email.com', 'New Contact from Sarah Johnson', 'Hi! I am planning my wedding for next summer and absolutely love your portfolio. I am looking for someone who can create elegant, romantic arrangements for a 150-guest wedding at a vineyard in Napa Valley. My budget is around $8,000 for all floral arrangements. Would love to discuss this with you!', 'wedding', 'high', 'unread', 'contact_form', NOW() - INTERVAL '2 days'),
    
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Michael Chen', 'michael.chen@techcorp.com', 'New Contact from Michael Chen', 'Hello, I am the event coordinator for TechCorp and we are planning our annual company retreat. We need floral arrangements for our welcome dinner (200 people) and awards ceremony. The event is in 6 weeks. Please let me know if you are available and your pricing for corporate events.', 'corporate', 'normal', 'unread', 'contact_form', NOW() - INTERVAL '1 day'),
    
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Emma Rodriguez', 'emma.rodriguez@gmail.com', 'New Contact from Emma Rodriguez', 'I am getting married in 3 months and need bohemian-style florals for my outdoor ceremony and reception. The venue is a rustic barn in the Hill Country. I love wildflowers and greenery. My budget is flexible around $4,000. Can we set up a consultation?', 'wedding', 'high', 'read', 'contact_form', NOW() - INTERVAL '5 days'),
    
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'David Park', 'david.park@email.com', 'New Contact from David Park', 'Hi there! I am planning a surprise 50th birthday party for my wife next month. She loves roses and peonies. The party is at our home for about 40 guests. Looking for centerpieces and some accent arrangements. What would you recommend?', 'birthday', 'normal', 'replied', 'contact_form', NOW() - INTERVAL '1 week'),
    
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Lisa Thompson', 'lisa.thompson@email.com', 'New Contact from Lisa Thompson', 'I am organizing a charity gala for 300 guests and need elegant floral arrangements that align with our "Enchanted Garden" theme. The event is in 2 months. We have a budget of $12,000 for florals. Would love to discuss this opportunity with you.', 'corporate', 'high', 'unread', 'contact_form', NOW() - INTERVAL '3 days'),
    
    ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Jessica Wu', 'jessica.wu@email.com', 'New Contact from Jessica Wu', 'Hello! I am planning an intimate wedding for 50 guests in my parents backyard. I love your romantic style and would like to know if you do smaller weddings. The date is flexible, sometime in the fall. Budget is around $3,000.', 'wedding', 'normal', 'unread', 'contact_form', NOW() - INTERVAL '4 days'),
    
    ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'Robert Kim', 'robert.kim@startup.com', 'New Contact from Robert Kim', 'We are a tech startup launching our new product and want to host a launch party with beautiful, modern floral arrangements. The event is for 80 people in 5 weeks. We love clean, contemporary designs. What are your rates for corporate events?', 'corporate', 'normal', 'read', 'contact_form', NOW() - INTERVAL '6 days'),
    
    ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Amanda Foster', 'amanda.foster@email.com', 'New Contact from Amanda Foster', 'I am planning my daughter''s graduation party and love your contemporary style. The party is in our backyard for about 60 people. I would like elegant arrangements that photograph well. The graduation is in 8 weeks. Can we discuss options?', 'graduation', 'normal', 'unread', 'contact_form', NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO NOTHING;

-- Create sample leads with realistic data
INSERT INTO leads (
    id, brand_id, customer_name, customer_email, customer_phone, company_name, 
    lead_source, lead_status, priority, estimated_budget, estimated_project_value,
    project_type, project_timeline, location, notes, tags, 
    last_contact_date, next_follow_up_date, inquiry_id, created_at
)
VALUES 
    -- Lead from Sarah Johnson's inquiry
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'sarah.johnson@email.com', '+1-555-123-4567', NULL, 'contact_form', 'new', 'high', 8000.00, 8500.00, 'Wedding - Vineyard', '6-8 months', 'Napa Valley, CA', 'Vineyard wedding, 150 guests, loves romantic elegant style. Very responsive and seems serious about booking.', ARRAY['wedding', 'vineyard', 'luxury', 'summer'], NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', '660e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days'),
    
    -- Lead from Michael Chen's inquiry
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Michael Chen', 'michael.chen@techcorp.com', '+1-555-234-5678', 'TechCorp', 'contact_form', 'contacted', 'high', 5000.00, 6000.00, 'Corporate Retreat', '1-2 months', 'Austin, TX', 'Corporate retreat for 200 people. Need arrangements for welcome dinner and awards ceremony. Follow up sent with proposal.', ARRAY['corporate', 'retreat', 'urgent'], NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', '660e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day'),
    
    -- Lead from Emma Rodriguez's inquiry
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Emma Rodriguez', 'emma.rodriguez@gmail.com', '+1-555-345-6789', NULL, 'contact_form', 'qualified', 'high', 4000.00, 4200.00, 'Wedding - Rustic Barn', '2-3 months', 'Hill Country, TX', 'Bohemian outdoor wedding at rustic barn. Loves wildflowers and greenery. Had consultation call, very interested.', ARRAY['wedding', 'bohemian', 'outdoor', 'barn'], NOW() - INTERVAL '3 days', NOW() + INTERVAL '3 days', '660e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '5 days'),
    
    -- Lead from David Park's inquiry
    ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'David Park', 'david.park@email.com', '+1-555-456-7890', NULL, 'contact_form', 'proposal_sent', 'medium', 1500.00, 1800.00, 'Birthday Party', '3-4 weeks', 'Chicago, IL', 'Surprise 50th birthday party for wife. Loves roses and peonies. Sent proposal with 3 package options.', ARRAY['birthday', 'surprise', 'roses', 'intimate'], NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', '660e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '1 week'),
    
    -- Lead from Lisa Thompson's inquiry
    ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Lisa Thompson', 'lisa.thompson@email.com', '+1-555-567-8901', 'Portland Children''s Foundation', 'contact_form', 'new', 'high', 12000.00, 15000.00, 'Charity Gala', '1-2 months', 'Portland, OR', 'Charity gala for 300 guests with "Enchanted Garden" theme. Large budget, great opportunity for brand exposure.', ARRAY['gala', 'charity', 'enchanted', 'large-event'], NOW() - INTERVAL '3 days', NOW() + INTERVAL '1 day', '660e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '3 days'),
    
    -- Lead from Jessica Wu's inquiry
    ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Jessica Wu', 'jessica.wu@email.com', '+1-555-678-9012', NULL, 'contact_form', 'nurturing', 'medium', 3000.00, 3200.00, 'Wedding - Intimate Backyard', '4-6 months', 'New York, NY', 'Intimate backyard wedding for 50 guests. Flexible timing, fall preferred. Smaller budget but good for portfolio.', ARRAY['wedding', 'intimate', 'backyard', 'fall'], NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 week', '660e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '4 days'),
    
    -- Lead from Robert Kim's inquiry
    ('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'Robert Kim', 'robert.kim@startup.com', '+1-555-789-0123', 'InnovateNow Startup', 'contact_form', 'contacted', 'medium', 2500.00, 3000.00, 'Product Launch Party', '1-2 months', 'Portland, OR', 'Tech startup product launch for 80 people. Loves contemporary designs. Sent initial information packet.', ARRAY['corporate', 'launch', 'tech', 'contemporary'], NOW() - INTERVAL '4 days', NOW() + INTERVAL '3 days', '660e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '6 days'),
    
    -- Lead from Amanda Foster's inquiry
    ('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Amanda Foster', 'amanda.foster@email.com', '+1-555-890-1234', NULL, 'contact_form', 'new', 'medium', 2000.00, 2300.00, 'Graduation Party', '1-2 months', 'Chicago, IL', 'Daughter''s graduation party for 60 people. Wants elegant arrangements that photograph well. Seems budget-conscious.', ARRAY['graduation', 'backyard', 'photography', 'elegant'], NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 days', '660e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '2 weeks'),
    
    -- Additional leads without inquiries (from other sources)
    ('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'Rachel Green', 'rachel.green@email.com', '+1-555-111-2222', NULL, 'referral', 'qualified', 'high', 10000.00, 12000.00, 'Wedding - Luxury Hotel', '3-4 months', 'Manhattan, NY', 'Referred by previous client. Luxury hotel wedding for 200 guests. High budget, very interested in premium package.', ARRAY['wedding', 'luxury', 'hotel', 'referral'], NOW() - INTERVAL '1 week', NOW() + INTERVAL '2 days', NULL, NOW() - INTERVAL '1 week'),
    
    ('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'Carlos Martinez', 'carlos.martinez@email.com', '+1-555-222-3333', 'Austin Event Planners', 'social_media', 'contacted', 'medium', 3500.00, 4000.00, 'Corporate Anniversary', '2-3 months', 'Austin, TX', 'Found us on Instagram. Corporate 10-year anniversary celebration. Event planner is handling coordination.', ARRAY['corporate', 'anniversary', 'instagram', 'event-planner'], NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 week', NULL, NOW() - INTERVAL '5 days'),
    
    ('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Sophia Davis', 'sophia.davis@email.com', '+1-555-333-4444', NULL, 'website', 'negotiating', 'high', 2800.00, 3200.00, 'Baby Shower', '3-4 weeks', 'San Francisco, CA', 'Elegant baby shower for 40 guests. Currently negotiating between two package options. Very detail-oriented.', ARRAY['baby-shower', 'elegant', 'intimate', 'negotiating'], NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', NULL, NOW() - INTERVAL '10 days'),
    
    ('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', 'James Wilson', 'james.wilson@email.com', '+1-555-444-5555', 'Wilson & Associates Law Firm', 'referral', 'won', 'medium', 4500.00, 4500.00, 'Office Opening', 'COMPLETED', 'Portland, OR', 'Law firm office opening celebration. Project completed successfully. Client very happy with results.', ARRAY['corporate', 'office-opening', 'completed', 'referral'], NOW() - INTERVAL '1 month', NULL, NULL, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- Create sample lead interactions
INSERT INTO lead_interactions (
    id, lead_id, interaction_type, interaction_date, subject, description, outcome, next_action, created_at
)
VALUES 
    -- Interactions for Sarah Johnson (high-value wedding lead)
    ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'email', NOW() - INTERVAL '2 days', 'Initial inquiry response', 'Sent welcome email with portfolio and pricing guide. Included vineyard wedding examples.', 'Positive response', 'Schedule consultation call', NOW() - INTERVAL '2 days'),
    
    -- Interactions for Michael Chen (corporate client)
    ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'email', NOW() - INTERVAL '1 day', 'Corporate proposal sent', 'Sent detailed proposal with 3 package options for corporate retreat. Included timeline and setup details.', 'Awaiting response', 'Follow up in 2 days if no response', NOW() - INTERVAL '1 day'),
    
    -- Interactions for Emma Rodriguez (bohemian wedding)
    ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'phone', NOW() - INTERVAL '3 days', 'Consultation call', 'Had 45-minute consultation call. Discussed vision, budget, and venue requirements. Very enthusiastic about working together.', 'Very interested', 'Send formal proposal with mood board', NOW() - INTERVAL '3 days'),
    ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', 'email', NOW() - INTERVAL '2 days', 'Proposal and mood board sent', 'Sent comprehensive proposal with mood board featuring wildflowers and greenery. Included 3 package options.', 'Positive feedback', 'Schedule venue visit', NOW() - INTERVAL '2 days'),
    
    -- Interactions for David Park (birthday party)
    ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004', 'email', NOW() - INTERVAL '5 days', 'Birthday party proposal', 'Sent proposal with 3 centerpiece options featuring roses and peonies. Included setup and delivery details.', 'Comparing options', 'Follow up on decision', NOW() - INTERVAL '5 days'),
    
    -- Interactions for Rachel Green (luxury referral)
    ('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440009', 'phone', NOW() - INTERVAL '1 week', 'Referral consultation', 'Initial call with referral from previous client. Discussed luxury hotel wedding vision and budget.', 'Very interested', 'Send luxury portfolio and pricing', NOW() - INTERVAL '1 week'),
    ('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440009', 'email', NOW() - INTERVAL '5 days', 'Luxury portfolio sent', 'Sent luxury wedding portfolio with hotel venue examples. Included premium package details.', 'Reviewing options', 'Schedule in-person meeting', NOW() - INTERVAL '5 days'),
    
    -- Interactions for Sophia Davis (baby shower - negotiating)
    ('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440011', 'email', NOW() - INTERVAL '8 days', 'Initial proposal sent', 'Sent baby shower proposal with elegant arrangements in soft pastels. Two package options provided.', 'Wants modifications', 'Revise proposal with requested changes', NOW() - INTERVAL '8 days'),
    ('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440011', 'phone', NOW() - INTERVAL '4 days', 'Negotiation call', 'Discussed modifications to proposal. Client wants specific flower types and custom color scheme.', 'Reaching agreement', 'Send revised proposal', NOW() - INTERVAL '4 days'),
    ('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440011', 'email', NOW() - INTERVAL '2 days', 'Revised proposal sent', 'Sent updated proposal with requested modifications. Included detailed breakdown of costs.', 'Under review', 'Follow up on final decision', NOW() - INTERVAL '2 days'),
    
    -- Interactions for James Wilson (completed project)
    ('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440012', 'meeting', NOW() - INTERVAL '2 months', 'Project completion', 'Successfully completed law firm office opening arrangements. Client extremely satisfied with results.', 'Project completed', 'Request testimonial and referrals', NOW() - INTERVAL '2 months'),
    ('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440012', 'email', NOW() - INTERVAL '1 month', 'Follow-up and testimonial', 'Received excellent testimonial from client. Discussed potential future events and referral opportunities.', 'Testimonial received', 'Add to portfolio and website', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Update lead scores based on the data we just inserted
UPDATE leads SET lead_score = calculate_lead_score(id);

-- Create some additional sample data for testing edge cases
INSERT INTO leads (
    id, brand_id, customer_name, customer_email, lead_source, lead_status, 
    priority, estimated_budget, project_type, project_timeline, location, 
    notes, tags, created_at
)
VALUES 
    -- High-value urgent lead
    ('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Victoria Sterling', 'victoria.sterling@email.com', 'referral', 'new', 'urgent', 25000.00, 'Wedding - Luxury Estate', 'ASAP', 'Hamptons, NY', 'Last-minute luxury wedding. Previous florist cancelled. Extremely high budget, needs immediate attention.', ARRAY['wedding', 'luxury', 'urgent', 'last-minute'], NOW() - INTERVAL '1 day'),
    
    -- Low-budget but high-potential lead
    ('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'Maria Gonzalez', 'maria.gonzalez@email.com', 'social_media', 'nurturing', 'low', 500.00, 'Small Wedding', '6+ months', 'San Francisco, CA', 'Small budget but very engaged on social media. Could lead to referrals and social media exposure.', ARRAY['wedding', 'small-budget', 'social-media', 'referrals'], NOW() - INTERVAL '2 weeks'),
    
    -- Corporate lead with repeat potential
    ('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'Jennifer Adams', 'jennifer.adams@globalcorp.com', 'website', 'qualified', 'high', 8000.00, 'Corporate Quarterly Meeting', '1-3 months', 'Chicago, IL', 'Large corporation with quarterly meetings. Potential for ongoing relationship and multiple events per year.', ARRAY['corporate', 'quarterly', 'repeat-client', 'ongoing'], NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- Update lead scores for the new leads
UPDATE leads SET lead_score = calculate_lead_score(id) WHERE id IN (
    '770e8400-e29b-41d4-a716-446655440013',
    '770e8400-e29b-41d4-a716-446655440014',
    '770e8400-e29b-41d4-a716-446655440015'
);

-- Display summary of inserted data
SELECT 
    'Brands' as table_name,
    COUNT(*) as records_inserted
FROM brands
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
)

UNION ALL

SELECT 
    'Inquiries' as table_name,
    COUNT(*) as records_inserted
FROM inquiries
WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%'

UNION ALL

SELECT 
    'Leads' as table_name,
    COUNT(*) as records_inserted
FROM leads
WHERE id LIKE '770e8400-e29b-41d4-a716-44665544%'

UNION ALL

SELECT 
    'Lead Interactions' as table_name,
    COUNT(*) as records_inserted
FROM lead_interactions
WHERE id LIKE '880e8400-e29b-41d4-a716-44665544%'; 