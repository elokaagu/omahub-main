const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTailoredOrdersTable() {
  try {
    console.log("🔨 Creating tailored_orders table...");

    // First, let's try to create a simple table structure
    // We'll use the service role key to bypass RLS temporarily

    // Try to insert a test record to see if table exists
    const { error: testError } = await supabase
      .from("tailored_orders")
      .select("*")
      .limit(0);

    if (!testError) {
      console.log("✅ tailored_orders table already exists!");
      return;
    }

    console.log("📋 Table does not exist. Creating it manually...");
    console.log("🔗 Please run this SQL in your Supabase SQL editor:");
    console.log("");
    console.log("```sql");
    console.log("-- Create tailored_orders table");
    console.log("CREATE TABLE tailored_orders (");
    console.log("  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,");
    console.log("  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,");
    console.log("  product_id UUID REFERENCES products(id) ON DELETE CASCADE,");
    console.log("  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,");
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
    console.log("");
    console.log("📝 After running the SQL:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Paste and run the SQL above");
    console.log("4. Test the custom order functionality again");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createTailoredOrdersTable();
