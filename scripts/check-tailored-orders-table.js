const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.log("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTailoredOrdersTable() {
  try {
    console.log("🔍 Checking tailored_orders table...");

    // Try to select from the table
    const { data, error } = await supabase
      .from("tailored_orders")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Error accessing tailored_orders table:", error.message);

      // Check if table doesn't exist
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.log("📋 Table does not exist. Creating it...");
        await createTailoredOrdersTable();
      }
    } else {
      console.log("✅ tailored_orders table exists and is accessible");
      console.log("📊 Sample data:", data);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

async function createTailoredOrdersTable() {
  try {
    console.log("🔨 Creating tailored_orders table...");

    const { error } = await supabase.rpc("exec_sql", {
      sql: `
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
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_tailored_orders_user_id ON tailored_orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_tailored_orders_brand_id ON tailored_orders(brand_id);
        CREATE INDEX IF NOT EXISTS idx_tailored_orders_status ON tailored_orders(status);
        
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
      `,
    });

    if (error) {
      console.error("❌ Error creating table:", error.message);

      // Try alternative approach - create table manually
      console.log("🔄 Trying alternative table creation...");
      await createTableManually();
    } else {
      console.log("✅ tailored_orders table created successfully");
    }
  } catch (error) {
    console.error("❌ Error in table creation:", error.message);
  }
}

async function createTableManually() {
  try {
    // Create table using direct SQL
    const { error: createError } = await supabase
      .from("tailored_orders")
      .select("*")
      .limit(0);

    if (createError) {
      console.log(
        "📋 Table still needs to be created manually in Supabase dashboard"
      );
      console.log("🔗 Please create the table with the following SQL:");
      console.log(`
        CREATE TABLE tailored_orders (
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
      `);
    }
  } catch (error) {
    console.error("❌ Manual table creation failed:", error.message);
  }
}

checkTailoredOrdersTable();
