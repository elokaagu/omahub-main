const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  try {
    console.log("🔍 Checking database schema...");

    // Check brands table structure
    console.log("\n📋 Checking brands table...");
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(1);

    if (brandsError) {
      console.error("❌ Error accessing brands table:", brandsError.message);
    } else {
      console.log("✅ Brands table accessible");
      if (brandsData && brandsData.length > 0) {
        const sampleBrand = brandsData[0];
        console.log("📊 Sample brand ID:", sampleBrand.id);
        console.log("📊 Sample brand ID type:", typeof sampleBrand.id);
        console.log("📊 Sample brand ID length:", sampleBrand.id.length);
      }
    }

    // Check profiles table structure
    console.log("\n📋 Checking profiles table...");
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .limit(1);

    if (profilesError) {
      console.error(
        "❌ Error accessing profiles table:",
        profilesError.message
      );
    } else {
      console.log("✅ Profiles table accessible");
      if (profilesData && profilesData.length > 0) {
        const sampleProfile = profilesData[0];
        console.log("📊 Sample profile ID:", sampleProfile.id);
        console.log("📊 Sample profile ID type:", typeof sampleProfile.id);
        console.log("📊 Sample profile ID length:", sampleProfile.id.length);
      }
    }

    // Check products table structure
    console.log("\n📋 Checking products table...");
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .limit(1);

    if (productsError) {
      console.error(
        "❌ Error accessing products table:",
        productsError.message
      );
    } else {
      console.log("✅ Products table accessible");
      if (productsData && productsData.length > 0) {
        const sampleProduct = productsData[0];
        console.log("📊 Sample product ID:", sampleProduct.id);
        console.log("📊 Sample product ID type:", typeof sampleProduct.id);
        console.log("📊 Sample product ID length:", sampleProduct.id.length);
      }
    }

    // Now provide the correct table creation SQL
    console.log("\n🔧 Corrected table creation SQL:");
    console.log("```sql");
    console.log("-- Drop table if it exists (to fix the constraint issue)");
    console.log("DROP TABLE IF EXISTS tailored_orders CASCADE;");
    console.log("");
    console.log("-- Create tailored_orders table with correct data types");
    console.log("CREATE TABLE tailored_orders (");
    console.log("  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,");
    console.log("  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,");
    console.log("  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,");
    console.log("  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,");
    console.log(
      "  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),"
    );
    console.log("  total_amount DECIMAL(10,2),");
    console.log("  currency TEXT DEFAULT 'USD',");
    console.log("  customer_notes TEXT,");
    console.log("  measurements JSONB DEFAULT '{}',");
    console.log("  delivery_address JSONB NOT NULL,");
    console.log("  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),");
    console.log("  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
    console.log(");");
    console.log("");
    console.log("-- Enable RLS");
    console.log("ALTER TABLE tailored_orders ENABLE ROW LEVEL SECURITY;");
    console.log("");
    console.log("-- Create indexes");
    console.log(
      "CREATE INDEX idx_tailored_orders_user_id ON tailored_orders(user_id);"
    );
    console.log(
      "CREATE INDEX idx_tailored_orders_brand_id ON tailored_orders(brand_id);"
    );
    console.log(
      "CREATE INDEX idx_tailored_orders_status ON tailored_orders(status);"
    );
    console.log("");
    console.log("-- Grant permissions");
    console.log("GRANT ALL ON tailored_orders TO authenticated;");
    console.log("GRANT ALL ON tailored_orders TO service_role;");
    console.log("```");
  } catch (error) {
    console.error("❌ Error checking schema:", error.message);
  }
}

checkDatabaseSchema();
