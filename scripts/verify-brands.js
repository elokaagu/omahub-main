#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Create clients with both keys to test both perspectives
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Verifying OmaHub Brand Access...");
  console.log("=================================");

  try {
    // Test with service role key (should show all brands)
    console.log("\n🔑 Using Service Role Key:");
    const { data: adminBrands, error: adminError } = await supabaseAdmin
      .from("brands")
      .select("*");

    if (adminError) {
      console.error("Error fetching brands with service role key:", adminError);
    } else {
      console.log(
        `✅ Found ${adminBrands.length} brands with service role key`
      );
      console.log(
        "Brand IDs:",
        adminBrands.map((brand) => brand.id).join(", ")
      );
    }

    // Test with anon key (public access)
    console.log("\n🔒 Using Anonymous Key (public access):");
    const { data: publicBrands, error: publicError } = await supabasePublic
      .from("brands")
      .select("*");

    if (publicError) {
      console.error("Error fetching brands with anon key:", publicError);
    } else {
      console.log(`✅ Found ${publicBrands.length} brands with anon key`);

      if (publicBrands.length < adminBrands?.length) {
        console.warn(
          "⚠️ Warning: Public access shows fewer brands than admin access"
        );
        console.warn(
          `   Admin sees ${adminBrands?.length}, Public sees ${publicBrands.length}`
        );
      }
    }

    // Test storage access
    console.log("\n📦 Testing Storage Access:");
    const { data: buckets, error: bucketsError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing storage buckets:", bucketsError);
    } else {
      console.log(`✅ Found ${buckets.length} storage buckets`);
      for (const bucket of buckets) {
        console.log(`   - ${bucket.name}`);

        // Test file listing
        const { data: files, error: filesError } = await supabaseAdmin.storage
          .from(bucket.name)
          .list();

        if (filesError) {
          console.error(
            `   ❌ Error listing files in ${bucket.name}:`,
            filesError
          );
        } else {
          console.log(
            `   ✅ Found ${files.length} files/folders in ${bucket.name}`
          );
        }
      }
    }

    console.log("\n=================================");
    console.log("Verification complete!");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
