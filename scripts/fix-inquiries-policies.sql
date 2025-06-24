-- Fix inquiries RLS policies to use profiles.owned_brands instead of non-existent brands.created_by

-- Drop existing policies
DROP POLICY IF EXISTS "Brand owners can view their inquiries" ON inquiries;
DROP POLICY IF EXISTS "Brand owners can update their inquiries" ON inquiries;

-- Create updated policies that use profiles.owned_brands
CREATE POLICY "Brand owners can view their inquiries" ON inquiries
    FOR SELECT USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Brand owners can update their inquiries" ON inquiries
    FOR UPDATE USING (
        brand_id = ANY(
            SELECT unnest(owned_brands) FROM profiles WHERE id = auth.uid()
        )
    );

-- Keep existing policies for anonymous users and super admins
-- (These should already exist and work correctly) 