-- Create leads system for tracking potential customers

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    company_name VARCHAR(255),
    lead_source VARCHAR(50) DEFAULT 'contact_form' CHECK (lead_source IN ('contact_form', 'social_media', 'referral', 'website', 'phone', 'email', 'event', 'advertisement')),
    lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'nurturing')),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_budget DECIMAL(10,2),
    estimated_project_value DECIMAL(10,2),
    project_type VARCHAR(100),
    project_timeline VARCHAR(100),
    location VARCHAR(255),
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    conversion_date TIMESTAMP WITH TIME ZONE, -- When lead converted to customer
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL, -- Link to original inquiry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead interactions table for tracking communication history
CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('email', 'phone', 'meeting', 'proposal', 'contract', 'note', 'follow_up')),
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subject VARCHAR(500),
    description TEXT,
    outcome VARCHAR(100),
    next_action VARCHAR(500),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_brand_id ON leads(brand_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_customer_email ON leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_date ON lead_interactions(interaction_date DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
-- Brand owners can see leads for their brands
CREATE POLICY "Brand owners can view their leads" ON leads
    FOR SELECT USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

-- Brand owners can update leads for their brands
CREATE POLICY "Brand owners can manage their leads" ON leads
    FOR ALL USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

-- Anyone can create leads (for contact forms)
CREATE POLICY "Anyone can create leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Super admins can do everything
CREATE POLICY "Super admins can manage all leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Create RLS policies for lead interactions
-- Brand owners can see interactions for their leads
CREATE POLICY "Brand owners can view their lead interactions" ON lead_interactions
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM leads WHERE brand_id = ANY(
                SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Brand owners can manage interactions for their leads
CREATE POLICY "Brand owners can manage their lead interactions" ON lead_interactions
    FOR ALL USING (
        lead_id IN (
            SELECT id FROM leads WHERE brand_id = ANY(
                SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Super admins can do everything
CREATE POLICY "Super admins can manage all lead interactions" ON lead_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_interactions TO authenticated;
GRANT SELECT, INSERT ON leads TO anon; -- Allow anonymous users to create leads via contact forms

-- Add comments for documentation
COMMENT ON TABLE leads IS 'Stores potential customer leads and their information';
COMMENT ON COLUMN leads.lead_source IS 'Where the lead came from: contact_form, social_media, referral, etc.';
COMMENT ON COLUMN leads.lead_status IS 'Current status of the lead in the sales pipeline';
COMMENT ON COLUMN leads.lead_score IS 'Lead scoring from 0-100 based on engagement and potential';
COMMENT ON COLUMN leads.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN leads.estimated_budget IS 'Customer budget estimate in dollars';
COMMENT ON COLUMN leads.estimated_project_value IS 'Potential project value in dollars';
COMMENT ON COLUMN leads.project_type IS 'Type of project: wedding, corporate event, home decor, etc.';
COMMENT ON COLUMN leads.project_timeline IS 'When the project is needed: ASAP, 1-3 months, 6+ months, etc.';
COMMENT ON COLUMN leads.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN leads.inquiry_id IS 'Link to the original inquiry that created this lead';

COMMENT ON TABLE lead_interactions IS 'Tracks all interactions and communication with leads';
COMMENT ON COLUMN lead_interactions.interaction_type IS 'Type of interaction: email, phone, meeting, etc.';
COMMENT ON COLUMN lead_interactions.outcome IS 'Result of the interaction';
COMMENT ON COLUMN lead_interactions.next_action IS 'What needs to be done next';

-- Create function to calculate lead score based on various factors
CREATE OR REPLACE FUNCTION calculate_lead_score(
    p_lead_id UUID
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    lead_record RECORD;
    interaction_count INTEGER;
    days_since_created INTEGER;
BEGIN
    -- Get lead data
    SELECT * INTO lead_record FROM leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Base score factors
    -- Budget range scoring
    IF lead_record.estimated_budget >= 10000 THEN
        score := score + 30;
    ELSIF lead_record.estimated_budget >= 5000 THEN
        score := score + 20;
    ELSIF lead_record.estimated_budget >= 1000 THEN
        score := score + 10;
    END IF;
    
    -- Timeline urgency scoring
    CASE lead_record.project_timeline
        WHEN 'ASAP' THEN score := score + 25;
        WHEN '1-3 months' THEN score := score + 20;
        WHEN '3-6 months' THEN score := score + 15;
        WHEN '6+ months' THEN score := score + 5;
        ELSE score := score + 10;
    END CASE;
    
    -- Interaction engagement scoring
    SELECT COUNT(*) INTO interaction_count 
    FROM lead_interactions 
    WHERE lead_id = p_lead_id;
    
    score := score + LEAST(interaction_count * 5, 25); -- Max 25 points for interactions
    
    -- Recency scoring (newer leads get higher scores)
    days_since_created := EXTRACT(DAY FROM NOW() - lead_record.created_at);
    IF days_since_created <= 7 THEN
        score := score + 15;
    ELSIF days_since_created <= 30 THEN
        score := score + 10;
    ELSIF days_since_created <= 90 THEN
        score := score + 5;
    END IF;
    
    -- Company name bonus (B2B leads)
    IF lead_record.company_name IS NOT NULL AND lead_record.company_name != '' THEN
        score := score + 10;
    END IF;
    
    -- Phone number bonus (more contact options)
    IF lead_record.customer_phone IS NOT NULL AND lead_record.customer_phone != '' THEN
        score := score + 5;
    END IF;
    
    -- Ensure score is within bounds
    RETURN LEAST(GREATEST(score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically update lead scores
CREATE OR REPLACE FUNCTION update_lead_score_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the lead score when lead data changes or interactions are added
    IF TG_TABLE_NAME = 'leads' THEN
        NEW.lead_score := calculate_lead_score(NEW.id);
        RETURN NEW;
    ELSIF TG_TABLE_NAME = 'lead_interactions' THEN
        UPDATE leads 
        SET lead_score = calculate_lead_score(NEW.lead_id),
            updated_at = NOW()
        WHERE id = NEW.lead_id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic lead scoring
DROP TRIGGER IF EXISTS update_lead_score_on_change ON leads;
CREATE TRIGGER update_lead_score_on_change
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_trigger();

DROP TRIGGER IF EXISTS update_lead_score_on_interaction ON lead_interactions;
CREATE TRIGGER update_lead_score_on_interaction
    AFTER INSERT OR UPDATE ON lead_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_trigger(); 