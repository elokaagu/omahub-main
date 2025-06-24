-- FAQ Management System Setup
-- Creates tables and policies for FAQ management

-- 1. Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'designers', 'customers', 'platform', 'billing', 'shipping')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  page_location VARCHAR(50) DEFAULT 'general' CHECK (page_location IN ('general', 'how-it-works', 'contact', 'join', 'all')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active_order ON public.faqs(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_page_location ON public.faqs(page_location, is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_created_at ON public.faqs(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for faqs
-- Public read access for active FAQs
CREATE POLICY "Public read access to active FAQs"
  ON public.faqs FOR SELECT
  USING (is_active = true);

-- Super admins can manage all FAQs
CREATE POLICY "Super admins can manage all FAQs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_faqs_updated_at ON public.faqs;
CREATE TRIGGER trigger_update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- 7. Insert default FAQs from the current hardcoded ones
INSERT INTO public.faqs (question, answer, category, display_order, page_location, is_active) VALUES
-- How it works page FAQs
('How do I find a designer for my specific needs?', 'You can browse our brand directory and filter by location, specialty, and style. Each designer profile includes their portfolio, reviews, and areas of expertise to help you find the perfect match.', 'customers', 1, 'how-it-works', true),
('What happens after I contact a designer?', 'Once you reach out, you''ll discuss your project directly with the designer. They''ll guide you through their process, which typically includes consultation, design concept, measurements, creation, and delivery.', 'customers', 2, 'how-it-works', true),
('How are payments handled on OmaHub?', 'Payments are arranged directly between you and the designer. Most designers require a deposit to begin work, with the remaining balance due at different stages or upon completion.', 'billing', 3, 'how-it-works', true),
('Do designers offer international shipping?', 'Many designers on our platform offer international shipping. Shipping policies, costs, and timeframes vary by designer and should be discussed during your initial consultation.', 'shipping', 4, 'how-it-works', true),
('How can I become a featured designer on OmaHub?', 'We''re always looking for talented designers to join our platform. Click on ''Join as a Designer'' to apply, and our team will review your portfolio and brand information.', 'designers', 5, 'how-it-works', true),

-- Join page FAQs
('What are the requirements to join?', 'We look for designers with a distinct aesthetic, quality craftsmanship, and a commitment to representing African fashion authentically. You should have an established brand with at least one collection or product line.', 'designers', 1, 'join', true),
('How does the verification process work?', 'After submission, our team reviews your application and may request additional information or samples. The verification process typically takes 2-3 weeks and includes checks on your brand identity, product quality, and customer service.', 'designers', 2, 'join', true),
('Is there a fee to join?', 'Currently, joining OmaHub is free for approved designers. In the future, we may introduce premium listing options with additional features and exposure.', 'billing', 3, 'join', true),
('What happens after I''m approved?', 'Once approved, we''ll help you create your brand profile, including professional photography of your collections if needed. You''ll be featured in our directory and may be included in editorial content and newsletters.', 'designers', 4, 'join', true),
('How will customers contact me?', 'Interested customers can reach out through a contact form on your brand profile, which will send inquiries directly to your email. We do not handle transactions or communications between you and potential clients.', 'platform', 5, 'join', true);

-- 8. Grant permissions
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT ON public.faqs TO authenticated;

-- 9. Verify the setup
SELECT 'FAQ Management System Created Successfully' as status;
SELECT category, COUNT(*) as count 
FROM public.faqs 
GROUP BY category 
ORDER BY category; 