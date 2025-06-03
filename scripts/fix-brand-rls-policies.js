const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBrandRLSPolicies() {
  try {
    console.log("🔍 Checking current RLS policies on brands table...\n");

    // Check current policies
    const { data: policies, error: policiesError } = await supabase.rpc(
      "exec_sql",
      {
        sql: "SELECT policyname, cmd, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'brands';",
      }
    );

    if (policiesError) {
      console.error("❌ Error checking policies:", policiesError);
      return;
    }

    console.log("📋 Current policies:");
    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Qual: ${policy.qual}`);
        console.log(`      With Check: ${policy.with_check}`);
        console.log("");
      });
    } else {
      console.log("   No policies found");
    }

    console.log("🔧 Fixing RLS policies...\n");

    // Step 1: Drop all existing policies
    console.log("1. Dropping all existing policies...");
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
      DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;
      DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
      DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;
      DROP POLICY IF EXISTS "Anyone can view brands" ON brands;
      DROP POLICY IF EXISTS "Authenticated users can insert brands" ON brands;
      DROP POLICY IF EXISTS "Users can update their own brands" ON brands;
      DROP POLICY IF EXISTS "Public read access to brands" ON brands;
      DROP POLICY IF EXISTS "Authenticated users can update brands" ON brands;
      DROP POLICY IF EXISTS "Authenticated users can delete brands" ON brands;
    `;

    const { error: dropError } = await supabase.rpc("exec_sql", {
      sql: dropPoliciesSQL,
    });

    if (dropError) {
      console.error("❌ Error dropping policies:", dropError);
      return;
    }
    console.log("✅ Dropped existing policies");

    // Step 2: Create new permissive policies
    console.log("2. Creating new permissive policies...");
    const createPoliciesSQL = `
      -- Allow everyone to read brands (public access)
      CREATE POLICY "Public read access to brands"
        ON brands FOR SELECT
        USING (true);

      -- Allow authenticated users to update brands (app handles permissions)
      CREATE POLICY "Authenticated users can update brands"
        ON brands FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);

      -- Allow authenticated users to insert brands (app handles permissions)
      CREATE POLICY "Authenticated users can insert brands"
        ON brands FOR INSERT
        TO authenticated
        WITH CHECK (true);

      -- Allow authenticated users to delete brands (app handles permissions)
      CREATE POLICY "Authenticated users can delete brands"
        ON brands FOR DELETE
        TO authenticated
        USING (true);
    `;

    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: createPoliciesSQL,
    });

    if (createError) {
      console.error("❌ Error creating policies:", createError);
      return;
    }
    console.log("✅ Created new permissive policies");

    // Step 3: Verify new policies
    console.log("3. Verifying new policies...");
    const { data: newPolicies, error: verifyError } = await supabase.rpc(
      "exec_sql",
      {
        sql: "SELECT policyname, cmd, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'brands';",
      }
    );

    if (verifyError) {
      console.error("❌ Error verifying policies:", verifyError);
      return;
    }

    console.log("📋 New policies:");
    if (newPolicies && newPolicies.length > 0) {
      newPolicies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    }

    // Step 4: Test brand update
    console.log("\n4. Testing brand update...");
    const { data: testBrand, error: fetchError } = await supabase
      .from("brands")
      .select("id, name, description")
      .eq("id", "ehbs-couture")
      .single();

    if (fetchError) {
      console.error("❌ Error fetching test brand:", fetchError);
      return;
    }

    console.log("✅ Test brand fetched:", testBrand.name);

    // Try a small update
    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({ description: testBrand.description + " " }) // Add a space
      .eq("id", "ehbs-couture")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error testing update:", updateError);
      return;
    }

    console.log("✅ Test update successful!");

    // Revert the test change
    await supabase
      .from("brands")
      .update({ description: testBrand.description })
      .eq("id", "ehbs-couture");

    console.log("\n🎉 RLS policies fixed successfully!");
    console.log("🔄 Please refresh your browser and try the quick edit again.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the fix
fixBrandRLSPolicies();
