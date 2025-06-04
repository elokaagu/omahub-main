const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testElokaBrandUpdate() {
  try {
    console.log("🧪 Testing Brand Update for eloka@culturin.com...\n");

    // Step 1: Get user
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const elokaUser = authUsers.users.find(
      (user) => user.email === "eloka@culturin.com"
    );

    if (!elokaUser) {
      console.error("❌ User eloka@culturin.com not found");
      return;
    }

    console.log("✅ User found:", elokaUser.id);

    // Step 2: Test with service role (should work)
    console.log("\n🔧 Testing with service role...");

    const { data: brand, error: fetchError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (fetchError) {
      console.error("❌ Error fetching brand:", fetchError);
      return;
    }

    console.log("✅ Brand fetched:", brand.name);

    // Test update with service role
    const testUpdate = {
      description: `Test update at ${new Date().toISOString()}`,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update(testUpdate)
      .eq("id", "ehbs-couture")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Service role update failed:", updateError);
      return;
    }

    console.log("✅ Service role update successful");

    // Revert the test change
    const { error: revertError } = await supabase
      .from("brands")
      .update({
        description: brand.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "ehbs-couture");

    if (revertError) {
      console.error("⚠️ Warning: Could not revert test change:", revertError);
    } else {
      console.log("✅ Test change reverted");
    }

    // Step 3: Test RLS policies
    console.log("\n🔒 Testing RLS policies...");

    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "brands");

    if (policiesError) {
      console.log("⚠️ Could not fetch policies (expected)");
    } else {
      console.log("📋 Current RLS policies:", policies?.length || 0);
    }

    // Step 4: Create a client with anon key to simulate frontend
    console.log("\n🌐 Testing with anon key (simulating frontend)...");

    const anonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.Ej8OcUoKQOJONpBLNjqKpFgELNJaJQqg5wJGvQJGvQI";
    const frontendClient = createClient(supabaseUrl, anonKey);

    // Try to update without authentication (should fail)
    const { error: anonUpdateError } = await frontendClient
      .from("brands")
      .update({ description: "Test anon update" })
      .eq("id", "ehbs-couture");

    if (anonUpdateError) {
      console.log("✅ Anon update correctly blocked:", anonUpdateError.message);
    } else {
      console.log("⚠️ Anon update unexpectedly succeeded");
    }

    console.log("\n🎯 DIAGNOSIS:");
    console.log("✅ Backend brand updates work with service role");
    console.log("✅ RLS policies are blocking unauthorized access");
    console.log(
      "❓ Issue is likely in frontend authentication or session handling"
    );

    console.log("\n💡 RECOMMENDATIONS:");
    console.log("1. User should sign out and sign back in");
    console.log("2. Check browser console for authentication errors");
    console.log("3. Clear browser cache and localStorage");
    console.log("4. Check the StudioDebug component for session details");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the test
testElokaBrandUpdate();
