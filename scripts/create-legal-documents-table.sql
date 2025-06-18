-- ========================================
-- CREATE LEGAL DOCUMENTS TABLE
-- Copy and paste this entire script into your Supabase Dashboard > SQL Editor
-- ========================================

-- Step 1: Create legal_documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('terms_of_service', 'privacy_policy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active document per type
  CONSTRAINT unique_active_document UNIQUE (document_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type_active 
ON public.legal_documents(document_type, is_active) 
WHERE is_active = true;

-- Step 3: Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Public read access to active documents
CREATE POLICY "legal_documents_public_read"
ON public.legal_documents FOR SELECT
TO public
USING (is_active = true);

-- Super admins can manage all documents
CREATE POLICY "legal_documents_super_admin_all"
ON public.legal_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Step 5: Create function to handle document versioning
CREATE OR REPLACE FUNCTION handle_legal_document_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- If making this document active, deactivate others of the same type
  IF NEW.is_active = true THEN
    UPDATE public.legal_documents 
    SET is_active = false 
    WHERE document_type = NEW.document_type 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for the function
DROP TRIGGER IF EXISTS legal_document_update_trigger ON public.legal_documents;
CREATE TRIGGER legal_document_update_trigger
  BEFORE INSERT OR UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_legal_document_update();

-- Step 7: Insert default documents
INSERT INTO public.legal_documents (document_type, title, content, effective_date, version)
VALUES 
(
  'terms_of_service',
  'Terms of Service',
  '<h2>1. Acceptance of Terms</h2>
<p>By accessing and using OmaHub, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

<h2>2. User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.</p>

<h2>3. Platform Rules</h2>
<p>Users must respect intellectual property rights, maintain professional conduct, and follow our community guidelines when using OmaHub.</p>

<h2>4. Content Ownership</h2>
<p>Users retain ownership of their content while granting OmaHub a license to display and promote the content on our platform.</p>

<h2>5. Modifications to Service</h2>
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>',
  '2025-07-01',
  1
),
(
  'privacy_policy',
  'Privacy Policy',
  '<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly to us, including when you create an account, update your profile, or communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience on OmaHub.</p>

<h2>3. Information Sharing</h2>
<p>We do not sell or rent your personal information to third parties. We may share your information with service providers who assist in our operations and with your consent.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at info@oma-hub.com</p>',
  '2025-07-01',
  1
)
ON CONFLICT DO NOTHING;

-- Step 8: Verify the setup
SELECT 'Legal Documents Table Created Successfully' as status;
SELECT document_type, title, version, is_active, effective_date 
FROM public.legal_documents 
ORDER BY document_type, version DESC; 