-- Setup Notifications System for OmaHub Studio
-- This script creates the notifications table and updates existing tables

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('basket_submission', 'custom_order', 'inquiry', 'review', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 4. Create RLS policies
CREATE POLICY "Brand owners can view notifications for their brands" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR brand_id = ANY(owned_brands))
    )
  );

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Brand owners can update notifications for their brands" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR brand_id = ANY(owned_brands))
    )
  );

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 5. Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- 6. Create tailored_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS tailored_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  customer_notes TEXT,
  measurements JSONB DEFAULT '{}',
  delivery_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on tailored_orders table
ALTER TABLE tailored_orders ENABLE ROW LEVEL SECURITY;

-- 8. Create indexes for tailored_orders
CREATE INDEX IF NOT EXISTS idx_tailored_orders_user_id ON tailored_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_brand_id ON tailored_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_tailored_orders_status ON tailored_orders(status);

-- 9. Grant permissions for tailored_orders
GRANT ALL ON tailored_orders TO authenticated;
GRANT ALL ON tailored_orders TO service_role;

-- 10. Insert sample notification for testing (optional)
-- INSERT INTO notifications (brand_id, user_id, type, title, message, data) 
-- VALUES (
--   (SELECT id FROM brands LIMIT 1),
--   (SELECT id FROM profiles LIMIT 1),
--   'system',
--   'System Ready',
--   'Notifications system is now active',
--   '{"system": "notifications_ready"}'
-- );

-- 11. Show summary
SELECT 
  'Notifications System Setup Complete' as status,
  COUNT(*) as notifications_count,
  'Ready for basket submissions' as message
FROM notifications;
