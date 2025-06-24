-- Fix Review Management System (Final Version)
-- This script handles missing user_id column and creates proper structure
-- Run this in Supabase SQL Editor

-- 1. Create the update function first
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add user_id column to reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' 
      AND column_name = 'user_id' 
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column to reviews table';
  ELSE
    RAISE NOTICE 'user_id column already exists in reviews table';
  END IF;
END $$;

-- 3. Add updated_at column to reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' 
      AND column_name = 'updated_at' 
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to reviews table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in reviews table';
  END IF;
END $$;

-- 4. Create review_replies table
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_admin_id ON public.review_replies(admin_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 6. Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- 7. Create trigger for updated_at on review_replies
DROP TRIGGER IF EXISTS set_review_replies_updated_at ON public.review_replies;
CREATE TRIGGER set_review_replies_updated_at
    BEFORE UPDATE ON public.review_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 8. Create trigger for updated_at on reviews
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 9. Create RLS policies for review_replies
DROP POLICY IF EXISTS "Review replies are viewable by everyone" ON public.review_replies;
CREATE POLICY "Review replies are viewable by everyone" 
  ON public.review_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage all review replies" ON public.review_replies;
CREATE POLICY "Service role can manage all review replies" 
  ON public.review_replies FOR ALL TO service_role USING (true);

-- 10. Create the reviews_with_details view (handling potential missing user_id)
CREATE OR REPLACE VIEW public.reviews_with_details AS
SELECT 
  r.id,
  r.brand_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) 
    THEN r.user_id 
    ELSE NULL 
  END as user_id,
  r.author,
  r.comment,
  r.rating,
  r.date,
  r.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' 
        AND column_name = 'updated_at' 
        AND table_schema = 'public'
    ) 
    THEN r.updated_at 
    ELSE r.created_at 
  END as updated_at,
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
GROUP BY r.id, r.brand_id, r.author, r.comment, r.rating, r.date, r.created_at, b.name, b.category
ORDER BY r.created_at DESC;

-- 11. Grant permissions
GRANT SELECT ON public.reviews_with_details TO authenticated;
GRANT SELECT ON public.reviews_with_details TO anon;

-- 12. Update RLS policies for reviews to allow admin management
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
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

-- 13. Verification
SELECT 'Review system setup completed successfully!' as status;

-- 14. Show final table structure
SELECT 
  'reviews table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 