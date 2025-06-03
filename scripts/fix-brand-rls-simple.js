const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAndFixBrandUpdates() {
  try {
    console.log("🔍 Testing brand update functionality...\n");

    // Step 1: Test current brand update
    console.log("1. Testing current brand update...");
    const { data: testBrand, error: fetchError } = await supabase
      .from("brands")
      .select("id, name, description, category")
      .eq("id", "ehbs-couture")
      .single();

    if (fetchError) {
      console.error("❌ Error fetching test brand:", fetchError);
      return;
    }

    console.log("✅ Test brand fetched:", testBrand.name);

    // Try a small update to test current permissions
    const originalDescription = testBrand.description;
    const testDescription = originalDescription + " [TEST]";

    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({ description: testDescription })
      .eq("id", "ehbs-couture")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Current update failed:", updateError);
      console.log(
        "🔧 This confirms the RLS policy issue. Let's check the error details:"
      );
      console.log("   Error code:", updateError.code);
      console.log("   Error message:", updateError.message);
      console.log("   Error details:", updateError.details);

      // The issue is likely RLS policies. Let's try to understand what's happening
      console.log("\n2. Attempting to diagnose the issue...");

      // Try with different approaches
      console.log("   Trying update with service role...");

      // Since we're using service role, this should work unless there's a policy issue
      // Let's try a more targeted approach
    } else {
      console.log("✅ Update successful! Reverting test change...");

      // Revert the test change
      await supabase
        .from("brands")
        .update({ description: originalDescription })
        .eq("id", "ehbs-couture");

      console.log("✅ Test reverted. Brand updates are working correctly!");
      return;
    }

    // If we get here, there's definitely an RLS issue
    console.log("\n3. Attempting to fix RLS policies...");

    // Let's try to disable RLS temporarily to test
    console.log("   Testing if RLS is the issue...");

    // Try a direct update with more specific error handling
    const { error: directUpdateError } = await supabase
      .from("brands")
      .update({
        description: testDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "ehbs-couture");

    if (directUpdateError) {
      console.error("❌ Direct update also failed:", directUpdateError);

      // Let's check if it's a permissions issue by trying to read
      const { data: readTest, error: readError } = await supabase
        .from("brands")
        .select("*")
        .eq("id", "ehbs-couture")
        .single();

      if (readError) {
        console.error("❌ Even reading failed:", readError);
      } else {
        console.log(
          "✅ Reading works, so it's specifically an update permission issue"
        );

        // The issue is definitely RLS policies for updates
        console.log("\n🎯 DIAGNOSIS: RLS policies are blocking brand updates");
        console.log("📋 SOLUTION NEEDED:");
        console.log(
          "   1. Check Supabase dashboard > Authentication > Policies"
        );
        console.log("   2. Look for brands table policies");
        console.log(
          "   3. Ensure there's a policy allowing authenticated users to update brands"
        );
        console.log(
          "   4. The policy should be: FOR UPDATE TO authenticated USING (true) WITH CHECK (true)"
        );

        console.log("\n🔧 MANUAL FIX REQUIRED:");
        console.log("   Go to your Supabase dashboard and run this SQL:");
        console.log("   ");
        console.log("   -- Drop existing restrictive policies");
        console.log(
          '   DROP POLICY IF EXISTS "Users can update their own brands" ON brands;'
        );
        console.log(
          '   DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;'
        );
        console.log("   ");
        console.log("   -- Create permissive update policy");
        console.log(
          '   CREATE POLICY "Allow authenticated users to update brands"'
        );
        console.log("     ON brands FOR UPDATE");
        console.log("     TO authenticated");
        console.log("     USING (true)");
        console.log("     WITH CHECK (true);");
        console.log("   ");

        // Let's also test what user context we're in
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (user) {
          console.log("   Current user context:", user.email);
        } else {
          console.log("   No user context (using service role)");
        }
      }
    } else {
      console.log("✅ Direct update worked! Reverting...");
      await supabase
        .from("brands")
        .update({ description: originalDescription })
        .eq("id", "ehbs-couture");
      console.log("✅ Brand updates are now working!");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the test and fix
testAndFixBrandUpdates();
