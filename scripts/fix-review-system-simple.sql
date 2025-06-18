-- Fix Review Management System (Simplified Version)
-- Run this in Supabase SQL Editor

-- 1. Create the update function first
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create review_replies table
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_admin_id ON public.review_replies(admin_id);

-- 4. Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS set_review_replies_updated_at ON public.review_replies;
CREATE TRIGGER set_review_replies_updated_at
    BEFORE UPDATE ON public.review_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. Create RLS policies
DROP POLICY IF EXISTS "Review replies are viewable by everyone" ON public.review_replies;
CREATE POLICY "Review replies are viewable by everyone" 
  ON public.review_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage all review replies" ON public.review_replies;
CREATE POLICY "Service role can manage all review replies" 
  ON public.review_replies FOR ALL TO service_role USING (true);

-- 7. Create the reviews_with_details view
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

-- 8. Grant permissions
GRANT SELECT ON public.reviews_with_details TO authenticated;
GRANT SELECT ON public.reviews_with_details TO anon;

-- 9. Verification
SELECT 'Review system setup completed successfully!' as status; 