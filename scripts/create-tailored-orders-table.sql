-- Create tailored_orders table for storing custom order requests
-- This table will store all data from both TailoredOrderModal and BrandRequestModal

-- Step 1: Create the tailored_orders table
CREATE TABLE IF NOT EXISTS public.tailored_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    customer_notes TEXT,
    brand_notes TEXT,
    
    -- Measurement preferences (from TailoredOrderModal)
    measurements JSONB NOT NULL DEFAULT '{}',
    
    -- Product preferences (from both forms)
    size TEXT,
    color TEXT,
    quantity INTEGER DEFAULT 1,
    
    -- Delivery information
    delivery_address JSONB NOT NULL,
    
    -- Order metadata
    estimated_completion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.tailored_orders ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON public.tailored_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.tailored_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders
CREATE POLICY "Users can update their own orders" ON public.tailored_orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Brand owners can view orders for their brands
CREATE POLICY "Brand owners can view orders for their brands" ON public.tailored_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'brand_admin' 
            AND brand_id = ANY(owned_brands)
        )
    );

-- Brand owners can update orders for their brands
CREATE POLICY "Brand owners can update orders for their brands" ON public.tailored_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'brand_admin' 
            AND brand_id = ANY(owned_brands)
        )
    );

-- Super admins can manage all orders
CREATE POLICY "Super admins can manage all orders" ON public.tailored_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Service role can manage all orders (for API operations)
CREATE POLICY "Service role can manage all orders" ON public.tailored_orders
    FOR ALL TO service_role USING (true);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tailored_orders_user_id ON public.tailored_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_brand_id ON public.tailored_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_product_id ON public.tailored_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_status ON public.tailored_orders(status);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_created_at ON public.tailored_orders(created_at);

-- Step 5: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_tailored_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tailored_orders_updated_at ON public.tailored_orders;
CREATE TRIGGER update_tailored_orders_updated_at
    BEFORE UPDATE ON public.tailored_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_tailored_orders_updated_at();

-- Step 7: Add comments for documentation
COMMENT ON TABLE public.tailored_orders IS 'Stores custom order requests from TailoredOrderModal and BrandRequestModal';
COMMENT ON COLUMN public.tailored_orders.measurements IS 'JSON object containing fit_preference, length_preference, sleeve_preference, and other measurement data';
COMMENT ON COLUMN public.tailored_orders.delivery_address IS 'JSON object containing full_name, email, phone, address_line_1, city, state, postal_code, country';

-- Step 8: Verify table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tailored_orders' 
ORDER BY ordinal_position;

-- Step 9: Verify RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tailored_orders';
