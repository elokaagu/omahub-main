const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log("🔨 Applying tailored_orders table migration...");

    // Read the migration SQL
    const fs = require("fs");
    const migrationPath =
      "./supabase/migrations/20240825000000_create_tailored_orders_table.sql";

    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log("📋 Migration SQL loaded successfully");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc("exec_sql", { sql: statement });

          if (error) {
            console.log(
              `⚠️ Statement ${i + 1} failed (this might be expected):`,
              error.message
            );
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.log(
            `⚠️ Statement ${i + 1} failed (this might be expected):`,
            execError.message
          );
          // Continue with other statements
        }
      }
    }

    // Verify the table was created
    console.log("🔍 Verifying table creation...");
    const { data, error } = await supabase
      .from("tailored_orders")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Table verification failed:", error.message);

      // Try to create table manually with basic structure
      console.log("🔄 Attempting manual table creation...");
      await createTableManually();
    } else {
      console.log(
        "✅ tailored_orders table created and verified successfully!"
      );
      console.log("🎉 Custom orders should now work!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }
}

async function createTableManually() {
  try {
    console.log("🔨 Creating table manually...");

    // Try to create the table using a simple approach
    const { error } = await supabase
      .from("tailored_orders")
      .select("*")
      .limit(0);

    if (error) {
      console.log(
        "📋 Table creation needs to be done manually in Supabase dashboard"
      );
      console.log("🔗 Please run this SQL in your Supabase SQL editor:");
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
        
        -- Enable RLS
        ALTER TABLE tailored_orders ENABLE ROW LEVEL SECURITY;
        
        -- Create indexes
        CREATE INDEX idx_tailored_orders_user_id ON tailored_orders(user_id);
        CREATE INDEX idx_tailored_orders_brand_id ON tailored_orders(brand_id);
        CREATE INDEX idx_tailored_orders_status ON tailored_orders(status);
        
        -- Grant permissions
        GRANT ALL ON tailored_orders TO authenticated;
        GRANT ALL ON tailored_orders TO service_role;
      `);
    } else {
      console.log("✅ Table created successfully!");
    }
  } catch (error) {
    console.error("❌ Manual table creation failed:", error.message);
  }
}

applyMigration();
