const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExactDataTypes() {
  try {
    console.log("🔍 Checking exact data types of ID columns...");

    // Check the actual table structure using information_schema
    console.log("\n📋 Checking table structure from information_schema...");

    const { data: columnsData, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("table_name, column_name, data_type, is_nullable, column_default")
      .in("table_name", ["profiles", "brands", "products"])
      .in("column_name", ["id"])
      .order("table_name");

    if (columnsError) {
      console.error(
        "❌ Error accessing information_schema:",
        columnsError.message
      );
    } else {
      console.log("✅ Table structure information:");
      columnsData.forEach((col) => {
        console.log(
          `📊 ${col.table_name}.${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
        );
      });
    }

    // Now provide the correct table creation SQL based on actual types
    console.log(
      "\n🔧 Corrected table creation SQL (based on actual data types):"
    );
    console.log("```sql");
    console.log("-- Drop table if it exists (to fix the constraint issue)");
    console.log("DROP TABLE IF EXISTS tailored_orders CASCADE;");
    console.log("");
    console.log("-- Create tailored_orders table with correct data types");
    console.log("CREATE TABLE tailored_orders (");
    console.log("  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,");
    console.log("  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,");
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

    console.log("\n📝 Key changes made:");
    console.log("- user_id: UUID (to match profiles.id)");
    console.log("- product_id: TEXT (to match products.id)");
    console.log("- brand_id: TEXT (to match brands.id)");
    console.log("- id: UUID (primary key)");
  } catch (error) {
    console.error("❌ Error checking data types:", error.message);
  }
}

checkExactDataTypes();
