-- Fix Review Management System
-- Run this in Supabase SQL Editor

-- 1. Create review_replies table
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_admin_id ON public.review_replies(admin_id);

-- 3. Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Review replies are viewable by everyone" 
  ON public.review_replies FOR SELECT USING (true);

CREATE POLICY "Service role can manage all review replies" 
  ON public.review_replies FOR ALL TO service_role USING (true);

-- 5. Create the reviews_with_details view
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

-- 6. Grant permissions
GRANT SELECT ON public.reviews_with_details TO authenticated;
GRANT SELECT ON public.reviews_with_details TO anon;

-- 7. Verification
SELECT 'Review system setup completed successfully!' as status; 