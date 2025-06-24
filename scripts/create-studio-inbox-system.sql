-- Studio Inbox System Setup
-- Creates tables for customer inquiries and messaging system

-- 1. Create inquiries table for customer messages to designers
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  inquiry_type VARCHAR(50) DEFAULT 'general' CHECK (inquiry_type IN ('general', 'custom_order', 'product_question', 'collaboration', 'wholesale')),
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'closed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source VARCHAR(50) DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'instagram', 'email', 'phone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- 2. Create inquiry_replies table for designer responses
CREATE TABLE IF NOT EXISTS public.inquiry_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create inquiry_attachments table for file attachments
CREATE TABLE IF NOT EXISTS public.inquiry_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by VARCHAR(50) DEFAULT 'customer' CHECK (uploaded_by IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_id ON public.inquiry_replies(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_admin_id ON public.inquiry_replies(admin_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_inquiry_id ON public.inquiry_attachments(inquiry_id);

-- 5. Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for inquiries
-- Customers can view their own inquiries (future feature)
CREATE POLICY "Customers can view their own inquiries" 
  ON public.inquiries FOR SELECT 
  USING (customer_email = auth.jwt() ->> 'email');

-- Brand admins can view inquiries for their brands
CREATE POLICY "Brand admins can view their brand inquiries" 
  ON public.inquiries FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

-- Super admins can view all inquiries
CREATE POLICY "Super admins can view all inquiries" 
  ON public.inquiries FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Brand admins can update inquiries for their brands
CREATE POLICY "Brand admins can update their brand inquiries" 
  ON public.inquiries FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

-- Super admins can update all inquiries
CREATE POLICY "Super admins can update all inquiries" 
  ON public.inquiries FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Service role can manage all inquiries
CREATE POLICY "Service role can manage all inquiries" 
  ON public.inquiries FOR ALL 
  TO service_role 
  USING (true);

-- 7. Create RLS policies for inquiry_replies
CREATE POLICY "Admins can view replies for their inquiries" 
  ON public.inquiry_replies FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = inquiry_id
      AND (
        p.role = 'super_admin' OR
        (p.role = 'brand_admin' AND i.brand_id = ANY(p.owned_brands))
      )
    )
  );

CREATE POLICY "Admins can create replies for their inquiries" 
  ON public.inquiry_replies FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = inquiry_id
      AND (
        p.role = 'super_admin' OR
        (p.role = 'brand_admin' AND i.brand_id = ANY(p.owned_brands))
      )
    )
  );

CREATE POLICY "Service role can manage all replies" 
  ON public.inquiry_replies FOR ALL 
  TO service_role 
  USING (true);

-- 8. Create RLS policies for inquiry_attachments
CREATE POLICY "Users can view attachments for accessible inquiries" 
  ON public.inquiry_attachments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id
      AND (
        i.customer_email = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() 
          AND (
            p.role = 'super_admin' OR
            (p.role = 'brand_admin' AND i.brand_id = ANY(p.owned_brands))
          )
        )
      )
    )
  );

CREATE POLICY "Service role can manage all attachments" 
  ON public.inquiry_attachments FOR ALL 
  TO service_role 
  USING (true);

-- 9. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_inquiry_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiry_updated_at();

CREATE TRIGGER set_inquiry_reply_updated_at
    BEFORE UPDATE ON public.inquiry_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 10. Create view for inquiries with details
CREATE OR REPLACE VIEW public.inquiries_with_details AS
SELECT 
  i.id,
  i.brand_id,
  i.customer_name,
  i.customer_email,
  i.customer_phone,
  i.subject,
  i.message,
  i.inquiry_type,
  i.status,
  i.priority,
  i.source,
  i.created_at,
  i.updated_at,
  i.read_at,
  i.replied_at,
  b.name as brand_name,
  b.category as brand_category,
  b.image as brand_image,
  -- Count of replies
  COALESCE(reply_count.count, 0) as reply_count,
  -- Latest reply info
  latest_reply.message as latest_reply_message,
  latest_reply.created_at as latest_reply_at,
  latest_reply.admin_name as latest_reply_admin,
  -- Attachments
  COALESCE(
    JSON_AGG(
      CASE 
        WHEN att.id IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', att.id,
            'file_name', att.file_name,
            'file_url', att.file_url,
            'file_size', att.file_size,
            'file_type', att.file_type,
            'uploaded_by', att.uploaded_by,
            'created_at', att.created_at
          )
        ELSE NULL
      END
    ) FILTER (WHERE att.id IS NOT NULL),
    '[]'::json
  ) as attachments
FROM public.inquiries i
LEFT JOIN public.brands b ON i.brand_id = b.id
LEFT JOIN public.inquiry_attachments att ON i.id = att.inquiry_id
LEFT JOIN (
  SELECT 
    inquiry_id, 
    COUNT(*) as count
  FROM public.inquiry_replies 
  WHERE is_internal_note = FALSE
  GROUP BY inquiry_id
) reply_count ON i.id = reply_count.inquiry_id
LEFT JOIN (
  SELECT DISTINCT ON (ir.inquiry_id)
    ir.inquiry_id,
    ir.message,
    ir.created_at,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as admin_name
  FROM public.inquiry_replies ir
  LEFT JOIN public.profiles p ON ir.admin_id = p.id
  WHERE ir.is_internal_note = FALSE
  ORDER BY ir.inquiry_id, ir.created_at DESC
) latest_reply ON i.id = latest_reply.inquiry_id
GROUP BY 
  i.id, i.brand_id, i.customer_name, i.customer_email, i.customer_phone,
  i.subject, i.message, i.inquiry_type, i.status, i.priority, i.source,
  i.created_at, i.updated_at, i.read_at, i.replied_at,
  b.name, b.category, b.image,
  reply_count.count, latest_reply.message, latest_reply.created_at, latest_reply.admin_name
ORDER BY i.created_at DESC;

-- 11. Grant permissions
GRANT SELECT ON public.inquiries_with_details TO authenticated;
GRANT SELECT ON public.inquiries_with_details TO anon;

-- 12. Create function to get inbox statistics
CREATE OR REPLACE FUNCTION get_inbox_stats(admin_user_id UUID)
RETURNS TABLE (
  total_inquiries BIGINT,
  unread_inquiries BIGINT,
  replied_inquiries BIGINT,
  urgent_inquiries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_inquiries,
    COUNT(*) FILTER (WHERE i.status = 'unread') as unread_inquiries,
    COUNT(*) FILTER (WHERE i.status = 'replied') as replied_inquiries,
    COUNT(*) FILTER (WHERE i.priority = 'urgent') as urgent_inquiries
  FROM public.inquiries i
  INNER JOIN public.profiles p ON p.id = admin_user_id
  WHERE p.role = 'super_admin' 
    OR (p.role = 'brand_admin' AND i.brand_id = ANY(p.owned_brands));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_inbox_stats(UUID) TO authenticated;

-- 13. Insert sample data for testing
INSERT INTO public.inquiries (brand_id, customer_name, customer_email, customer_phone, subject, message, inquiry_type, priority, source) VALUES
('adire-designs', 'Amara Johnson', 'amara.johnson@email.com', '+234 803 123 4567', 'Custom Adire Dress Order', 'Hi! I love your traditional adire designs. I would like to place a custom order for a wedding dress with blue and white adire patterns. What are your available fabrics and pricing?', 'custom_order', 'high', 'website'),
('lagos-bridal', 'Chioma Okafor', 'chioma.okafor@email.com', '+234 901 234 5678', 'Bridal Package Inquiry', 'Hello, I am getting married in December and interested in your complete bridal package. Can you provide details about what is included and pricing options?', 'general', 'normal', 'whatsapp'),
('beads-by-nneka', 'Fatima Abdullahi', 'fatima.abdullahi@email.com', '+234 812 345 6789', 'Wholesale Beads Order', 'Good day! I run a jewelry business in Abuja and would like to inquire about wholesale pricing for your beautiful beads. Do you offer bulk discounts?', 'wholesale', 'normal', 'website');

-- 14. Verification
SELECT 'Studio Inbox System setup completed successfully!' as status;

-- Show sample data
SELECT 
  'Sample inquiries created:' as info,
  brand_id,
  customer_name,
  subject,
  inquiry_type,
  status
FROM public.inquiries
ORDER BY created_at DESC; 