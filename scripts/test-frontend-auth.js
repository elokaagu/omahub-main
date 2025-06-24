const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8";

// Create Supabase client with anon key (like frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuth() {
  try {
    console.log("🔍 Testing frontend authentication and brand updates...\n");

    // Step 1: Try to sign in as eloka@culturin.com
    console.log("1. Attempting to sign in as eloka@culturin.com...");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "eloka@culturin.com",
        password: "password123", // You'll need to provide the actual password
      });

    if (authError) {
      console.error("❌ Authentication failed:", authError.message);
      console.log(
        "🔧 This might be the issue - the user can't authenticate properly"
      );

      // Let's try to check if the user exists
      console.log("\n2. Checking if user exists in auth...");
      // We can't check auth users with anon key, so let's try a different approach

      console.log("📋 DIAGNOSIS: Authentication issue detected");
      console.log("   The quick edit is failing because:");
      console.log("   1. User authentication is not working properly");
      console.log(
        "   2. Frontend is using createClientComponentClient() which needs auth"
      );
      console.log("   3. Without proper auth, RLS policies block the update");

      console.log("\n🔧 SOLUTIONS:");
      console.log("   Option 1: Fix user authentication");
      console.log("   Option 2: Update RLS policies to be more permissive");
      console.log(
        "   Option 3: Use service role for brand updates in admin context"
      );

      return;
    }

    console.log("✅ Authentication successful!");
    console.log("   User ID:", authData.user.id);
    console.log("   Email:", authData.user.email);

    // Step 2: Test brand update with authenticated user
    console.log("\n3. Testing brand update with authenticated user...");

    const { data: testBrand, error: fetchError } = await supabase
      .from("brands")
      .select("id, name, description")
      .eq("id", "ehbs-couture")
      .single();

    if (fetchError) {
      console.error("❌ Error fetching brand:", fetchError);
      return;
    }

    console.log("✅ Brand fetched:", testBrand.name);

    // Try update
    const originalDescription = testBrand.description;
    const testDescription = originalDescription + " [AUTH TEST]";

    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({ description: testDescription })
      .eq("id", "ehbs-couture")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Authenticated update failed:", updateError);
      console.log("🔧 Even with authentication, the update is failing");
      console.log("   This confirms it's an RLS policy issue");
    } else {
      console.log("✅ Authenticated update successful!");

      // Revert
      await supabase
        .from("brands")
        .update({ description: originalDescription })
        .eq("id", "ehbs-couture");

      console.log("✅ Test reverted. Frontend authentication is working!");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the test
testFrontendAuth();
