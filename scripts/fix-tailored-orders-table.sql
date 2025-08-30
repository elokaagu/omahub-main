-- Fix Tailored Orders Table Structure
-- This script ensures the tailored_orders table has all required columns

-- Step 1: Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tailored_orders'
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add color column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'color'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN color TEXT;
        RAISE NOTICE 'Added color column';
    END IF;

    -- Add size column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'size'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN size TEXT;
        RAISE NOTICE 'Added size column';
    END IF;

    -- Add quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Added quantity column';
    END IF;

    -- Add measurements column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'measurements'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN measurements JSONB NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added measurements column';
    END IF;

    -- Add delivery_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN delivery_address JSONB NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added delivery_address column';
    END IF;

    -- Add customer_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'customer_notes'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN customer_notes TEXT;
        RAISE NOTICE 'Added customer_notes column';
    END IF;

    -- Add brand_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'brand_notes'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN brand_notes TEXT;
        RAISE NOTICE 'Added brand_notes column';
    END IF;

    -- Add estimated_completion column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'estimated_completion'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN estimated_completion TEXT;
        RAISE NOTICE 'Added estimated_completion column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tailored_orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.tailored_orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

END $$;

-- Step 3: Verify the updated structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tailored_orders'
ORDER BY ordinal_position;

-- Step 4: Test inserting a sample order
INSERT INTO public.tailored_orders (
    user_id,
    product_id,
    brand_id,
    status,
    total_amount,
    currency,
    customer_notes,
    size,
    color,
    quantity,
    measurements,
    delivery_address
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Placeholder user ID
    '00000000-0000-0000-0000-000000000000', -- Placeholder product ID
    '00000000-0000-0000-0000-000000000000', -- Placeholder brand ID
    'pending',
    100.00,
    'USD',
    'Test order',
    'M',
    'Blue',
    1,
    '{"fit_preference": "regular", "length_preference": "regular"}',
    '{"full_name": "Test User", "email": "test@example.com", "phone": "+1234567890"}'
);

-- Step 5: Show the test order
SELECT 
    id,
    status,
    total_amount,
    size,
    color,
    quantity
FROM public.tailored_orders 
WHERE customer_notes = 'Test order'
ORDER BY created_at DESC
LIMIT 1;

-- Step 6: Clean up test data
DELETE FROM public.tailored_orders WHERE customer_notes = 'Test order';

-- Step 7: Success message
SELECT 'Tailored orders table structure fixed successfully!' as status;
