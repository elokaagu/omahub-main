-- Full-Text Search Enhancement for OmaHub
-- This script adds full-text search capabilities to products and brands

-- 1. Add search vector columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create function to update search vectors
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.name, '') || ' ' || 
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category, '') || ' ' ||
        coalesce(NEW.tags::text, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_brand_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.name, '') || ' ' || 
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category, '') || ' ' ||
        coalesce(NEW.location, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers to automatically update search vectors
DROP TRIGGER IF EXISTS products_search_vector_trigger ON public.products;
CREATE TRIGGER products_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_search_vector();

DROP TRIGGER IF EXISTS brands_search_vector_trigger ON public.brands;
CREATE TRIGGER brands_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_search_vector();

-- 4. Update existing records
UPDATE public.products SET search_vector = to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(tags::text, '')
);

UPDATE public.brands SET search_vector = to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(location, '')
);

-- 5. Create GIN indexes for fast text search
CREATE INDEX IF NOT EXISTS idx_products_search_gin 
ON public.products USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_brands_search_gin 
ON public.brands USING GIN(search_vector);

-- 6. Create search functions for easy use
CREATE OR REPLACE FUNCTION search_products(search_query text)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    brand_id TEXT,
    category VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.brand_id,
        p.category,
        ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.products p
    WHERE p.search_vector @@ plainto_tsquery('english', search_query)
        AND p.status = 'active'
    ORDER BY rank DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_brands(search_query text)
RETURNS TABLE (
    id TEXT,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    location VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.description,
        b.category,
        b.location,
        ts_rank(b.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.brands b
    WHERE b.search_vector @@ plainto_tsquery('english', search_query)
        AND b.status = 'active'
    ORDER BY rank DESC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION search_products(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_brands(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products(text) TO anon;
GRANT EXECUTE ON FUNCTION search_brands(text) TO anon;

-- 8. Example usage queries (commented out)
-- SELECT * FROM search_products('adire dress');
-- SELECT * FROM search_brands('lagos fashion');

SELECT 'Full-text search enhancement completed successfully!' as status; 