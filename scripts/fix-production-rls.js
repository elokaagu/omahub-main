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
    // Fix brands table policies
    console.log("📋 Fixing brands table policies...");

    const brandsRLSFix = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.brands;
      DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
      DROP POLICY IF EXISTS "Allow public read access to brands" ON public.brands;
      
      -- Create policy for public access
      CREATE POLICY "Public read access to brands"
      ON public.brands
      FOR SELECT
      TO public
      USING (true);
      
      -- Grant permissions
      GRANT SELECT ON public.brands TO anon;
      GRANT SELECT ON public.brands TO authenticated;
    `;

    const { error: brandsError } = await supabase.rpc("exec_sql", {
      sql: brandsRLSFix,
    });

    if (brandsError) {
      console.error("❌ Error fixing brands policies:", brandsError);
    } else {
      console.log("✅ Brands table policies fixed");
    }

    // Fix collections table policies
    console.log("📋 Fixing collections table policies...");

    const collectionsRLSFix = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Allow public read access to collections" ON public.collections;
      DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;
      
      -- Create policy for public access
      CREATE POLICY "Public read access to collections"
      ON public.collections
      FOR SELECT
      TO public
      USING (true);
      
      -- Grant permissions
      GRANT SELECT ON public.collections TO anon;
      GRANT SELECT ON public.collections TO authenticated;
    `;

    const { error: collectionsError } = await supabase.rpc("exec_sql", {
      sql: collectionsRLSFix,
    });

    if (collectionsError) {
      console.error("❌ Error fixing collections policies:", collectionsError);
    } else {
      console.log("✅ Collections table policies fixed");
    }

    // Fix reviews table policies
    console.log("📋 Fixing reviews table policies...");

    const reviewsRLSFix = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
      DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
      
      -- Create policy for public access
      CREATE POLICY "Public read access to reviews"
      ON public.reviews
      FOR SELECT
      TO public
      USING (true);
      
      -- Grant permissions
      GRANT SELECT ON public.reviews TO anon;
      GRANT SELECT ON public.reviews TO authenticated;
    `;

    const { error: reviewsError } = await supabase.rpc("exec_sql", {
      sql: reviewsRLSFix,
    });

    if (reviewsError) {
      console.error("❌ Error fixing reviews policies:", reviewsError);
    } else {
      console.log("✅ Reviews table policies fixed");
    }

    // Test the fix by trying to read brands as anonymous user
    console.log("🧪 Testing the fix...");

    const testClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: testBrands, error: testError } = await testClient
      .from("brands")
      .select("id, name")
      .limit(1);

    if (testError) {
      console.error("❌ Test failed:", testError);
    } else {
      console.log("✅ Test successful! Anonymous users can now read brands");
      console.log(`📊 Found ${testBrands?.length || 0} brands`);
    }

    console.log("\n🎉 RLS policies fixed for production!");
    console.log("Your production site should now work correctly.");
  } catch (error) {
    console.error("❌ Error fixing RLS policies:", error);
    process.exit(1);
  }
}

// Run the fix
fixProductionRLS();
