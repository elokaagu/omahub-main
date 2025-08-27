const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  console.error(
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runContactEmailMigration() {
  console.log("🚀 Starting brand contact email migration...\n");

  try {
    // Step 1: Add contact_email column if it doesn't exist
    console.log("📝 Adding contact_email column to brands table...");

    // Use direct SQL execution instead of RPC
    const { error: alterError } = await supabase
      .from("brands")
      .select("contact_email")
      .limit(1);

    if (alterError && alterError.code === "42703") {
      // Column doesn't exist, we need to add it
      console.log("Column doesn't exist, adding it...");
      // Note: In production, you'd run the SQL script directly in Supabase
      console.log(
        "⚠️ Please run the SQL script in Supabase SQL Editor to add the column"
      );
      console.log("File: scripts/add-brand-contact-email-system.sql");
      return;
    }

    console.log("✅ contact_email column exists or was added successfully");

    // Step 2: Update existing brands with default email
    console.log("\n📧 Updating existing brands with default contact email...");
    const { data: updateResult, error: updateError } = await supabase
      .from("brands")
      .update({ contact_email: "info@oma-hub.com" })
      .is("contact_email", null);

    if (updateError) {
      console.error("❌ Failed to update brands:", updateError);
      return;
    }
    console.log("✅ Default contact email set for existing brands");

    // Step 3: Verify the migration
    console.log("\n🔍 Verifying migration results...");
    const { data: brands, error: selectError } = await supabase
      .from("brands")
      .select("id, name, contact_email, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (selectError) {
      console.error("❌ Failed to verify brands:", selectError);
      return;
    }

    console.log("📊 Migration Results:");
    console.log("Sample brands and their contact emails:");
    brands.forEach((brand) => {
      console.log(`  ${brand.name}: ${brand.contact_email || "NULL"}`);
    });

    // Step 4: Get total counts
    const { count: totalBrands, error: countError } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Failed to get brand count:", countError);
      return;
    }

    const { count: brandsWithEmail, error: emailCountError } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true })
      .not("contact_email", "is", null);

    if (emailCountError) {
      console.error("❌ Failed to get email count:", emailCountError);
      return;
    }

    console.log("\n📈 Summary:");
    console.log(`  Total brands: ${totalBrands}`);
    console.log(`  Brands with contact email: ${brandsWithEmail}`);
    console.log(
      `  Brands without contact email: ${totalBrands - brandsWithEmail}`
    );

    console.log("\n🎉 Migration completed successfully!");
    console.log("💡 Next steps:");
    console.log(
      "  1. Run the SQL script in Supabase SQL editor for RLS policies"
    );
    console.log("  2. Test the contact form with a brand");
    console.log("  3. Check that inquiries appear in Studio inbox");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

runContactEmailMigration();
