const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductsSchema() {
  try {
    console.log("🔧 Fixing products table schema...");

    // First, let's check the current schema
    console.log("\n📋 Checking current products table structure...");

    // Try to select from products to see current structure
    const { data: sampleProduct, error: selectError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (selectError) {
      console.error("❌ Error checking products table:", selectError);
      return;
    }

    console.log("✅ Products table exists");
    if (sampleProduct && sampleProduct.length > 0) {
      console.log("Current columns:", Object.keys(sampleProduct[0]));
    }

    // Add missing columns using individual ALTER TABLE statements
    console.log("\n🔧 Adding missing columns...");

    const alterStatements = [
      "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials TEXT[]",
      "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT",
      "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false",
      "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time TEXT",
      "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[]",
    ];

    for (const statement of alterStatements) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: statement });
        if (error) {
          console.log(`⚠️  Could not execute: ${statement}`);
          console.log("Error:", error.message);
        } else {
          console.log(`✅ Executed: ${statement}`);
        }
      } catch (err) {
        console.log(`⚠️  Exception executing: ${statement}`);
        console.log("Error:", err.message);
      }
    }

    // Update existing records to have proper defaults
    console.log("\n🔄 Updating existing records with defaults...");

    const { error: updateError } = await supabase
      .from("products")
      .update({
        materials: [],
        is_custom: false,
      })
      .is("materials", null);

    if (updateError) {
      console.log(
        "⚠️  Could not update existing records:",
        updateError.message
      );
    } else {
      console.log("✅ Updated existing records with defaults");
    }

    // Verify the fix by checking if we can now create a product
    console.log("\n🧪 Testing product creation...");

    const testProduct = {
      title: "Test Product Schema Fix",
      description: "Testing if schema fix worked",
      price: 100,
      image: "https://via.placeholder.com/400x400?text=Test",
      brand_id: "test-brand",
      category: "Test",
      in_stock: true,
      materials: ["Cotton"],
      care_instructions: "Machine wash",
      is_custom: false,
      lead_time: "1 week",
    };

    const { data: testResult, error: testError } = await supabase
      .from("products")
      .insert(testProduct)
      .select()
      .single();

    if (testError) {
      console.error("❌ Test product creation failed:", testError);
      console.log("\n📝 Manual SQL needed:");
      console.log(`
-- Run this SQL in your Supabase SQL editor:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[];

-- Update existing records
UPDATE public.products 
SET 
  materials = COALESCE(materials, '{}'),
  is_custom = COALESCE(is_custom, false)
WHERE materials IS NULL OR is_custom IS NULL;
      `);
    } else {
      console.log("✅ Test product created successfully!");
      console.log("Product ID:", testResult.id);

      // Clean up test product
      await supabase.from("products").delete().eq("id", testResult.id);
      console.log("🧹 Cleaned up test product");
    }

    console.log("\n🎉 Products table schema fix completed!");
  } catch (error) {
    console.error("❌ Error fixing products schema:", error);
  }
}

fixProductsSchema();
