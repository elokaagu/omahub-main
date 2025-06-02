#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixProductionRLS() {
  console.log("🔧 Fixing RLS policies for production...");

  try {
    // Test current access for anonymous users
    console.log("🧪 Testing current anonymous access...");

    const testClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test brands access
    const { data: testBrands, error: brandsError } = await testClient
      .from("brands")
      .select("id, name")
      .limit(1);

    if (brandsError) {
      console.error("❌ Brands access failed:", brandsError);
    } else {
      console.log(
        `✅ Brands access working - Found ${testBrands?.length || 0} brands`
      );
    }

    // Test collections access
    const { data: testCollections, error: collectionsError } = await testClient
      .from("collections")
      .select("id, title")
      .limit(1);

    if (collectionsError) {
      console.error("❌ Collections access failed:", collectionsError);
    } else {
      console.log(
        `✅ Collections access working - Found ${testCollections?.length || 0} collections`
      );
    }

    // Test reviews access
    const { data: testReviews, error: reviewsError } = await testClient
      .from("reviews")
      .select("id, author")
      .limit(1);

    if (reviewsError) {
      console.error("❌ Reviews access failed:", reviewsError);
    } else {
      console.log(
        `✅ Reviews access working - Found ${testReviews?.length || 0} reviews`
      );
    }

    // Check current policies
    console.log("\n📋 Checking current RLS policies...");

    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd")
      .in("tablename", ["brands", "collections", "reviews"]);

    if (policiesError) {
      console.error("❌ Error checking policies:", policiesError);
    } else {
      console.log("Current policies:");
      policies?.forEach((policy) => {
        console.log(
          `  ${policy.tablename}: ${policy.policyname} (${policy.cmd}) - Roles: ${policy.roles}`
        );
      });
    }

    console.log("\n🎉 Diagnosis complete!");

    if (!brandsError && !collectionsError && !reviewsError) {
      console.log("✅ All tables are accessible to anonymous users");
      console.log("🌐 Your production site should be working correctly");
    } else {
      console.log(
        "⚠️  Some tables have access issues that need to be fixed in Supabase dashboard"
      );
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
    process.exit(1);
  }
}

// Run the diagnosis
fixProductionRLS();
