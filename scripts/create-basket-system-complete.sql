-- ========================================
-- COMPLETE BASKET SYSTEM SETUP
-- This script creates all tables and RLS policies needed
-- ========================================

-- Step 0: Clean up any existing tables and policies (safe to run multiple times)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.basket_items CASCADE;
DROP TABLE IF EXISTS public.baskets CASCADE;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own baskets" ON public.baskets;
DROP POLICY IF EXISTS "Users can create baskets" ON public.baskets;
DROP POLICY IF EXISTS "Users can update their own baskets" ON public.baskets;
DROP POLICY IF EXISTS "Users can delete their own baskets" ON public.baskets;

DROP POLICY IF EXISTS "Users can view their own basket items" ON public.basket_items;
DROP POLICY IF EXISTS "Users can create basket items" ON public.basket_items;
DROP POLICY IF EXISTS "Users can update their own basket items" ON public.basket_items;
DROP POLICY IF EXISTS "Users can delete their own basket items" ON public.basket_items;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Brand admins can view brand orders" ON public.orders;
DROP POLICY IF EXISTS "Brand admins can update brand orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Brand admins can view brand order items" ON public.order_items;

-- Step 1: Create baskets table
CREATE TABLE public.baskets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE 
    CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- Step 2: Create basket_items table
CREATE TABLE public.basket_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    basket_id UUID NOT NULL REFERENCES public.baskets(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(basket_id, product_id, size, color)
);

-- Step 3: Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    delivery_address JSONB NOT NULL,
    customer_notes TEXT,
    brand_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create order_items table
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_baskets_user_id ON public.baskets(user_id);
CREATE INDEX idx_baskets_brand_id ON public.baskets(brand_id);
CREATE INDEX idx_basket_items_basket_id ON public.basket_items(basket_id);
CREATE INDEX idx_basket_items_product_id ON public.basket_items(product_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_brand_id ON public.orders(brand_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Step 6: Enable Row Level Security
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for baskets
CREATE POLICY "Users can view their own baskets" ON public.baskets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create baskets" ON public.baskets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baskets" ON public.baskets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baskets" ON public.baskets
    FOR DELETE USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for basket_items
CREATE POLICY "Users can view their own basket items" ON public.basket_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.baskets 
            WHERE id = basket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create basket items" ON public.basket_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.baskets 
            WHERE id = basket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own basket items" ON public.basket_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.baskets 
            WHERE id = basket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own basket items" ON public.basket_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.baskets 
            WHERE id = basket_id AND user_id = auth.uid()
        )
    );

-- Step 9: Create RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Brand admins can view and update orders for their brands
CREATE POLICY "Brand admins can view brand orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.brands 
            WHERE id = brand_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Brand admins can update brand orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.brands 
            WHERE id = brand_id AND owner_id = auth.uid()
        )
    );

-- Step 10: Create RLS policies for order_items
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND user_id = auth.uid()
        )
    );

-- Brand admins can view order items for their brand orders
CREATE POLICY "Brand admins can view brand order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.brands b ON o.brand_id = b.id
            WHERE o.id = order_id AND b.owner_id = auth.uid()
        )
    );

-- Step 11: Grant necessary permissions to service role (for API operations)
GRANT ALL ON public.baskets TO service_role;
GRANT ALL ON public.basket_items TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- Step 12: Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Complete basket system created successfully!';
    RAISE NOTICE 'Tables created: baskets, basket_items, orders, order_items';
    RAISE NOTICE 'All RLS policies configured for users and brand admins';
    RAISE NOTICE 'Service role permissions granted for API operations';
    RAISE NOTICE 'Indexes created for performance';
END $$;
