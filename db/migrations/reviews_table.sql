-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster retrieval of reviews by brand
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id ON public.reviews(brand_id);

-- Add index for user's reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Add RLS policies

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews 
  FOR SELECT 
  USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can add reviews" 
  ON public.reviews 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
  ON public.reviews 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
  ON public.reviews 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Service role can manage all reviews
CREATE POLICY "Service role can manage all reviews" 
  ON public.reviews 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create function to update brand rating when reviews change
CREATE OR REPLACE FUNCTION update_brand_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(2,1);
BEGIN
  -- Calculate average rating
  SELECT COALESCE(ROUND(AVG(rating) * 10) / 10, 0)
  INTO avg_rating
  FROM public.reviews
  WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id);
  
  -- Update brand rating
  UPDATE public.brands
  SET rating = avg_rating
  WHERE id = COALESCE(NEW.brand_id, OLD.brand_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update brand rating
CREATE TRIGGER update_brand_rating_insert_update
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_brand_rating();

CREATE TRIGGER update_brand_rating_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_brand_rating();

-- Update function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 