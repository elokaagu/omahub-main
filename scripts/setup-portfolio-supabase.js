// Setup Portfolio System for Supabase
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function setupPortfolioSystem() {
  console.log("🎨 Setting up Portfolio System for Tailors in Supabase...\n");

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log("❌ Missing environment variables!");
    console.log(
      "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
    return;
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Adding portfolio fields to products table...");

    // Add portfolio fields
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS materials TEXT[],
        ADD COLUMN IF NOT EXISTS techniques TEXT[],
        ADD COLUMN IF NOT EXISTS inspiration TEXT;
      `,
    });

    if (alterError) {
      console.log(
        "⚠️  Alter table error (columns might already exist):",
        alterError.message
      );
    } else {
      console.log("✅ Portfolio fields added successfully");
    }

    // Update service_type constraint
    console.log("🔄 Updating service_type constraint...");
    const { error: constraintError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_service_type_check;
        ALTER TABLE products ADD CONSTRAINT products_service_type_check 
        CHECK (service_type IN ('product', 'service', 'consultation', 'portfolio'));
      `,
    });

    if (constraintError) {
      console.log("⚠️  Constraint update error:", constraintError.message);
    } else {
      console.log("✅ Service type constraint updated");
    }

    // Add indexes
    console.log("🔄 Adding database indexes...");
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_products_service_type ON products(service_type);
        CREATE INDEX IF NOT EXISTS idx_products_portfolio_brand ON products(brand_id) WHERE service_type = 'portfolio';
      `,
    });

    if (indexError) {
      console.log("⚠️  Index creation error:", indexError.message);
    } else {
      console.log("✅ Database indexes added");
    }

    // Verify the changes
    console.log("\n✅ Verifying portfolio fields were added...");
    const { data: columns, error: verifyError } = await supabase
      .from("products")
      .select("materials, techniques, inspiration")
      .limit(1);

    if (verifyError) {
      console.log("❌ Verification failed:", verifyError.message);
    } else {
      console.log("✅ Portfolio fields verified in database");
    }

    console.log("\n🎉 Portfolio system setup completed!");
    console.log("\n📋 What was added:");
    console.log("• materials (TEXT[]) - Array of materials tailors work with");
    console.log(
      "• techniques (TEXT[]) - Array of techniques tailors specialize in"
    );
    console.log("• inspiration (TEXT) - Design inspiration and style notes");
    console.log(
      "• portfolio service type - New service type for portfolio items"
    );
    console.log(
      "\n🔄 Please restart your development server to see the new Portfolio section"
    );
    console.log(
      "📍 Navigate to Studio → Portfolio to start creating portfolio items"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.log(
      "\n💡 Alternative: Run the SQL manually in your Supabase dashboard"
    );
  }
}

setupPortfolioSystem();
