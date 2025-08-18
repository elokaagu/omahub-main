-- Fix Missing DELETE Policies for Inbox System
-- This script adds the missing DELETE policies that are preventing inquiry deletion

-- 1. Add DELETE policy for inquiries table (BRAND ADMINS)
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

-- 2. Add DELETE policy for inquiries table (SUPER ADMINS)
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

-- 3. Add DELETE policy for inquiry_replies table (BRAND ADMINS)
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

-- 4. Add DELETE policy for inquiry_replies table (SUPER ADMINS)
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

-- 5. Add DELETE policy for inquiry_attachments table (BRAND ADMINS)
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

-- 6. Add DELETE policy for inquiry_attachments table (SUPER ADMINS)
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

-- 7. Verify the policies were created
-- You can check this in Supabase dashboard under Authentication > Policies
-- Or run: SELECT * FROM pg_policies WHERE tablename IN ('inquiries', 'inquiry_replies', 'inquiry_attachments');

-- 8. Test deletion (this should now work)
-- The existing DELETE endpoint should now successfully remove inquiries and all related data from the database

-- 9. Note: The ON DELETE CASCADE constraints on inquiry_replies and inquiry_attachments
-- should automatically handle deletion of related records when an inquiry is deleted
