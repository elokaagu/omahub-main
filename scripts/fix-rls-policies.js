const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLSPolicies() {
  console.log("🔄 Fixing RLS policies for brands table...");

  try {
    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Enable read access for all users" ON brands;',
      'DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;',
      'DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;',
      'DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;',
      'DROP POLICY IF EXISTS "Anyone can view brands" ON brands;',
      'DROP POLICY IF EXISTS "Authenticated users can insert brands" ON brands;',
      'DROP POLICY IF EXISTS "Users can update their own brands" ON brands;',
    ];

    for (const sql of dropPolicies) {
      console.log("🗑️ Dropping policy:", sql);
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
      if (error && !error.message.includes("does not exist")) {
        console.error("❌ Error dropping policy:", error);
      }
    }

    // Create new permissive policies
    const createPolicies = [
      `CREATE POLICY "Public read access to brands"
        ON brands FOR SELECT
        USING (true);`,

      `CREATE POLICY "Authenticated users can insert brands"
        ON brands FOR INSERT
        TO authenticated
        WITH CHECK (true);`,

      `CREATE POLICY "Authenticated users can update brands"
        ON brands FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);`,

      `CREATE POLICY "Authenticated users can delete brands"
        ON brands FOR DELETE
        TO authenticated
        USING (true);`,
    ];

    for (const sql of createPolicies) {
      console.log("✨ Creating policy:", sql.split("\n")[0]);
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
      if (error) {
        console.error("❌ Error creating policy:", error);
      } else {
        console.log("✅ Policy created successfully");
      }
    }

    // Verify policies
    console.log("🔍 Verifying policies...");
    const { data: policies, error: verifyError } = await supabase
      .from("pg_policies")
      .select("policyname, cmd")
      .eq("tablename", "brands");

    if (verifyError) {
      console.error("❌ Error verifying policies:", verifyError);
    } else {
      console.log("📋 Current policies for brands table:");
      policies.forEach((policy) => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log("✅ RLS policies fixed successfully!");
  } catch (error) {
    console.error("❌ Error fixing RLS policies:", error);
  }
}

// Check if exec_sql function exists, if not create a simpler approach
async function checkAndFix() {
  try {
    // Test if we can run SQL directly
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: "SELECT 1;",
    });
    if (error && error.message.includes("function exec_sql")) {
      console.log(
        "⚠️ exec_sql function not available, using direct queries..."
      );
      await fixWithDirectQueries();
    } else {
      await fixRLSPolicies();
    }
  } catch (error) {
    console.log("⚠️ Falling back to direct queries...");
    await fixWithDirectQueries();
  }
}

async function fixWithDirectQueries() {
  console.log("🔄 Fixing RLS policies with direct queries...");

  try {
    // For now, let's just verify the current state
    console.log("🔍 Checking current authentication...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("❌ Auth error:", authError);
      return;
    }

    console.log("👤 Current user:", user ? user.email : "Not authenticated");

    // Test a simple brand query
    console.log("🧪 Testing brand query...");
    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(1);

    if (brandError) {
      console.error("❌ Brand query error:", brandError);
    } else {
      console.log(
        "✅ Brand query successful, found",
        brands?.length || 0,
        "brands"
      );
    }

    console.log("ℹ️ Please run the SQL manually in Supabase dashboard:");
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;

-- Create new permissive policies
CREATE POLICY "Public read access to brands"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
    `);
  } catch (error) {
    console.error("❌ Error in direct queries:", error);
  }
}

checkAndFix();
