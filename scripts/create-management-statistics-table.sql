-- Create management_statistics table to track various platform statistics
CREATE TABLE IF NOT EXISTS public.management_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  metric_value INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on management_statistics
ALTER TABLE public.management_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for management_statistics
CREATE POLICY "Allow public read access to management_statistics" 
  ON public.management_statistics FOR SELECT 
  USING (true);

CREATE POLICY "Allow admins to manage statistics" 
  ON public.management_statistics FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert initial statistics metrics
INSERT INTO public.management_statistics (metric_name, metric_value) 
VALUES 
  ('total_brands', 0),
  ('verified_brands', 0),
  ('active_brands', 0),
  ('total_reviews', 0),
  ('total_products', 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Function to update brand statistics
CREATE OR REPLACE FUNCTION update_brand_statistics()
RETURNS void AS $$
DECLARE
  brand_count INTEGER;
  verified_count INTEGER;
  active_count INTEGER;
  review_count INTEGER;
  product_count INTEGER;
BEGIN
  -- Count total brands
  SELECT COUNT(*) INTO brand_count FROM public.brands;
  
  -- Count verified brands
  SELECT COUNT(*) INTO verified_count FROM public.brands WHERE is_verified = true;
  
  -- Count active brands (brands with reviews or created in last 90 days)
  SELECT COUNT(*) INTO active_count 
  FROM public.brands b 
  WHERE EXISTS (
    SELECT 1 FROM public.reviews r WHERE r.brand_id = b.id
  ) OR b.created_at > NOW() - INTERVAL '90 days';
  
  -- Count total reviews
  SELECT COUNT(*) INTO review_count FROM public.reviews;
  
  -- Count total products (if products table exists)
  SELECT COUNT(*) INTO product_count 
  FROM public.products 
  WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'products' AND table_schema = 'public'
  );
  
  -- Update statistics
  UPDATE public.management_statistics 
  SET metric_value = brand_count, last_updated = NOW() 
  WHERE metric_name = 'total_brands';
  
  UPDATE public.management_statistics 
  SET metric_value = verified_count, last_updated = NOW() 
  WHERE metric_name = 'verified_brands';
  
  UPDATE public.management_statistics 
  SET metric_value = active_count, last_updated = NOW() 
  WHERE metric_name = 'active_brands';
  
  UPDATE public.management_statistics 
  SET metric_value = review_count, last_updated = NOW() 
  WHERE metric_name = 'total_reviews';
  
  UPDATE public.management_statistics 
  SET metric_value = product_count, last_updated = NOW() 
  WHERE metric_name = 'total_products';
  
  RAISE NOTICE 'Brand statistics updated: % brands, % verified, % active', 
    brand_count, verified_count, active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle brand deletion statistics update
CREATE OR REPLACE FUNCTION handle_brand_deletion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics after brand deletion
  PERFORM update_brand_statistics();
  
  -- Log the deletion
  RAISE NOTICE 'Brand deleted: %, statistics updated', OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle brand insertion statistics update
CREATE OR REPLACE FUNCTION handle_brand_insertion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics after brand creation
  PERFORM update_brand_statistics();
  
  -- Log the creation
  RAISE NOTICE 'Brand created: %, statistics updated', NEW.name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle brand update statistics update
CREATE OR REPLACE FUNCTION handle_brand_update_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if verification status changed
  IF OLD.is_verified != NEW.is_verified THEN
    PERFORM update_brand_statistics();
    RAISE NOTICE 'Brand verification changed for: %, statistics updated', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle review changes statistics update
CREATE OR REPLACE FUNCTION handle_review_change_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics after review changes
  PERFORM update_brand_statistics();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic statistics updates
DROP TRIGGER IF EXISTS brand_deletion_stats_trigger ON public.brands;
CREATE TRIGGER brand_deletion_stats_trigger
  AFTER DELETE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION handle_brand_deletion_stats();

DROP TRIGGER IF EXISTS brand_insertion_stats_trigger ON public.brands;
CREATE TRIGGER brand_insertion_stats_trigger
  AFTER INSERT ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION handle_brand_insertion_stats();

DROP TRIGGER IF EXISTS brand_update_stats_trigger ON public.brands;
CREATE TRIGGER brand_update_stats_trigger
  AFTER UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION handle_brand_update_stats();

-- Create triggers for review changes (if reviews table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'reviews' AND table_schema = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS review_change_stats_trigger ON public.reviews;
    CREATE TRIGGER review_change_stats_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.reviews
      FOR EACH ROW
      EXECUTE FUNCTION handle_review_change_stats();
  END IF;
END $$;

-- Initialize statistics with current data
SELECT update_brand_statistics();

-- Create a view for easy access to statistics
CREATE OR REPLACE VIEW public.platform_statistics AS
SELECT 
  metric_name,
  metric_value,
  last_updated,
  created_at
FROM public.management_statistics
ORDER BY metric_name;

-- Grant access to the view
GRANT SELECT ON public.platform_statistics TO authenticated;
GRANT SELECT ON public.platform_statistics TO anon;

-- Verification query
SELECT 
  metric_name,
  metric_value,
  last_updated
FROM public.management_statistics
ORDER BY metric_name; 