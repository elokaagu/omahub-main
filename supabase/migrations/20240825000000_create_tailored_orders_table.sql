-- Create tailored_orders table for custom product orders
CREATE TABLE IF NOT EXISTS tailored_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  customer_notes TEXT,
  measurements JSONB DEFAULT '{}',
  delivery_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tailored_orders ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tailored_orders_user_id ON tailored_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_brand_id ON tailored_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_status ON tailored_orders(status);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_created_at ON tailored_orders(created_at);

-- RLS Policies
CREATE POLICY "Users can view their own orders" ON tailored_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON tailored_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Brand owners can view orders for their brands" ON tailored_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR brand_id = ANY(owned_brands))
    )
  );

CREATE POLICY "Brand owners can update orders for their brands" ON tailored_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR brand_id = ANY(owned_brands))
    )
  );

-- Grant permissions
GRANT ALL ON tailored_orders TO authenticated;
GRANT ALL ON tailored_orders TO service_role;
