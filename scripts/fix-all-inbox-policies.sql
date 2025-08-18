-- Complete Fix for All Missing Inbox System Policies
-- This script ensures all CRUD operations work correctly for the inbox system

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Brand admins can delete their brand inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Super admins can delete all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Brand admins can delete replies for their brand inquiries" ON public.inquiry_replies;
DROP POLICY IF EXISTS "Super admins can delete all inquiry replies" ON public.inquiry_replies;
DROP POLICY IF EXISTS "Brand admins can delete attachments for their brand inquiries" ON public.inquiry_attachments;
DROP POLICY IF EXISTS "Super admins can delete all inquiry attachments" ON public.inquiry_attachments;

-- 2. Create comprehensive policies for inquiries table
-- SELECT policies (should already exist, but ensuring they're correct)
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

-- INSERT policies (should already exist)
CREATE POLICY "Anyone can create inquiries" 
  ON public.inquiries FOR INSERT 
  WITH CHECK (true);

-- UPDATE policies (should already exist)
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

-- DELETE policies (MISSING - this is what we're fixing)
CREATE POLICY "Brand admins can delete their brand inquiries" 
  ON public.inquiries FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'brand_admin' 
      AND brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Super admins can delete all inquiries" 
  ON public.inquiries FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- 3. Create comprehensive policies for inquiry_replies table
-- SELECT policies (should already exist)
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

-- INSERT policies (should already exist)
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

-- UPDATE policies (should already exist)
CREATE POLICY "Admins can update replies for their inquiries" 
  ON public.inquiry_replies FOR UPDATE 
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

-- DELETE policies (MISSING - this is what we're fixing)
CREATE POLICY "Brand admins can delete replies for their brand inquiries" 
  ON public.inquiry_replies FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = inquiry_id
      AND p.role = 'brand_admin' 
      AND i.brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Super admins can delete all inquiry replies" 
  ON public.inquiry_replies FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- 4. Create comprehensive policies for inquiry_attachments table
-- SELECT policies (should already exist)
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

-- INSERT policies (should already exist)
CREATE POLICY "Admins can create attachments for their inquiries" 
  ON public.inquiry_attachments FOR INSERT 
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

-- UPDATE policies (should already exist)
CREATE POLICY "Admins can update attachments for their inquiries" 
  ON public.inquiry_attachments FOR UPDATE 
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

-- DELETE policies (MISSING - this is what we're fixing)
CREATE POLICY "Brand admins can delete attachments for their brand inquiries" 
  ON public.inquiry_attachments FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.id = inquiry_id
      AND p.role = 'brand_admin' 
      AND i.brand_id = ANY(p.owned_brands)
    )
  );

CREATE POLICY "Super admins can delete all inquiry attachments" 
  ON public.inquiry_attachments FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- 5. Ensure service role has full access (should already exist)
CREATE POLICY "Service role can manage all inquiries" 
  ON public.inquiries FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Service role can manage all replies" 
  ON public.inquiry_replies FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Service role can manage all attachments" 
  ON public.inquiry_attachments FOR ALL 
  TO service_role 
  USING (true);

-- 6. Verify all policies are created
-- Run this query to check: SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('inquiries', 'inquiry_replies', 'inquiry_attachments') ORDER BY tablename, cmd;

-- 7. Test the deletion functionality
-- The DELETE endpoint should now work correctly for both brand admins and super admins
