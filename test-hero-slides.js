const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHeroSlides() {
  console.log("🧪 Testing hero slides functionality...\n");

  try {
    // Test 1: Check if table exists by trying to select from it
    console.log("1️⃣ Testing table existence...");
    const { data: tableTest, error: tableError } = await supabase
      .from("hero_slides")
      .select("*", { count: "exact", head: true });

    if (tableError) {
      console.error(
        "❌ Table does not exist or is not accessible:",
        tableError.message
      );
      return;
    }
    console.log("✅ hero_slides table exists and is accessible");
    console.log(`📊 Current record count: ${tableTest?.length || 0}\n`);

    // Test 2: Check current user session
    console.log("2️⃣ Testing authentication...");
    const { data: session, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      console.error("❌ Auth error:", authError.message);
    } else if (!session.session) {
      console.log("⚠️ No active session - user not logged in");
    } else {
      console.log("✅ User is authenticated");
      console.log(`👤 User ID: ${session.session.user.id}`);
    }
    console.log("");

    // Test 3: Check user profile and permissions
    if (session.session) {
      console.log("3️⃣ Testing user permissions...");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.session.user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError.message);
      } else {
        console.log("✅ Profile found");
        console.log(`🔑 User role: ${profile.role}`);
        console.log(`🛡️ Is super admin: ${profile.role === "super_admin"}`);
      }
      console.log("");
    }

    // Test 4: Try to fetch existing hero slides
    console.log("4️⃣ Testing hero slides fetch...");
    const { data: slides, error: fetchError } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching hero slides:", fetchError.message);
    } else {
      console.log("✅ Successfully fetched hero slides");
      console.log(`📋 Found ${slides.length} hero slides`);
      if (slides.length > 0) {
        console.log("📝 Sample slide:", {
          id: slides[0].id,
          title: slides[0].title,
          display_order: slides[0].display_order,
          is_active: slides[0].is_active,
        });
      }
    }
    console.log("");

    // Test 5: Check RLS policies
    console.log("5️⃣ Testing RLS policies...");
    const { data: policies, error: policyError } = await supabase
      .rpc("get_policies_for_table", { table_name: "hero_slides" })
      .catch(() => ({
        data: null,
        error: { message: "RPC function not available" },
      }));

    if (policyError) {
      console.log("⚠️ Could not check RLS policies:", policyError.message);
    } else if (policies) {
      console.log("✅ RLS policies found");
      console.log(`📜 Number of policies: ${policies.length}`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testHeroSlides()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
