-- Create review_replies table for admin responses to reviews
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_admin_id ON public.review_replies(admin_id);

-- Enable Row Level Security
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_replies

-- Everyone can read replies (public access)
CREATE POLICY "Review replies are viewable by everyone" 
  ON public.review_replies 
  FOR SELECT 
  USING (true);

-- Only super admins and brand admins can insert replies
CREATE POLICY "Admins can add review replies" 
  ON public.review_replies 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'brand_admin')
    )
  );

-- Only the admin who created the reply or super admins can update
CREATE POLICY "Admins can update their own replies" 
  ON public.review_replies 
  FOR UPDATE 
  TO authenticated 
  USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Only the admin who created the reply or super admins can delete
CREATE POLICY "Admins can delete their own replies" 
  ON public.review_replies 
  FOR DELETE 
  TO authenticated 
  USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Service role can manage all replies
CREATE POLICY "Service role can manage all review replies" 
  ON public.review_replies 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create trigger for updated_at timestamp
CREATE TRIGGER set_review_replies_updated_at
BEFORE UPDATE ON public.review_replies
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Update RLS policies for reviews table to allow admin management

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Allow admins to manage all reviews" ON public.reviews;

-- Create comprehensive admin policy for reviews
CREATE POLICY "Admins can manage reviews" 
  ON public.reviews 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'brand_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'brand_admin')
    )
  );

-- Create a view for reviews with replies and brand information
CREATE OR REPLACE VIEW public.reviews_with_details AS
SELECT 
  r.id,
  r.brand_id,
  r.user_id,
  r.author,
  r.comment,
  r.rating,
  r.date,
  r.created_at,
  r.updated_at,
  b.name as brand_name,
  b.category as brand_category,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', rr.id,
        'reply_text', rr.reply_text,
        'admin_id', rr.admin_id,
        'admin_name', COALESCE(p.first_name || ' ' || p.last_name, p.email),
        'created_at', rr.created_at,
        'updated_at', rr.updated_at
      ) ORDER BY rr.created_at ASC
    ) FILTER (WHERE rr.id IS NOT NULL),
    '[]'::json
  ) as replies
FROM public.reviews r
LEFT JOIN public.brands b ON r.brand_id = b.id
LEFT JOIN public.review_replies rr ON r.id = rr.review_id
LEFT JOIN public.profiles p ON rr.admin_id = p.id
GROUP BY r.id, r.brand_id, r.user_id, r.author, r.comment, r.rating, r.date, r.created_at, r.updated_at, b.name, b.category
ORDER BY r.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.reviews_with_details TO authenticated;
GRANT SELECT ON public.reviews_with_details TO anon;

-- Create function to get reviews for brand admins (only their brands)
CREATE OR REPLACE FUNCTION get_brand_admin_reviews(admin_user_id UUID)
RETURNS TABLE (
  id UUID,
  brand_id TEXT,
  user_id UUID,
  author VARCHAR(255),
  comment TEXT,
  rating DECIMAL(2,1),
  date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  brand_name TEXT,
  brand_category TEXT,
  replies JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rv.id,
    rv.brand_id,
    rv.user_id,
    rv.author,
    rv.comment,
    rv.rating,
    rv.date,
    rv.created_at,
    rv.updated_at,
    rv.brand_name,
    rv.brand_category,
    rv.replies
  FROM public.reviews_with_details rv
  INNER JOIN public.profiles p ON p.id = admin_user_id
  WHERE p.role = 'brand_admin' 
    AND rv.brand_id = ANY(p.owned_brands)
  ORDER BY rv.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_brand_admin_reviews(UUID) TO authenticated;

-- Verification queries
SELECT 'Review replies table created successfully' as status;
SELECT 'Policies created for review management' as status;
SELECT 'Views and functions created for review administration' as status; 