const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProfilesRLS() {
  console.log("🔄 Fixing RLS policies for profiles table...");

  const sqlCommands = [
    // Drop existing policies that might be too restrictive
    'DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON profiles;',
    'DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;',
    'DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;',
    'DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;',
    'DROP POLICY IF EXISTS "Super admins can create any profile" ON profiles;',
    'DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;',

    // Create comprehensive policies for profiles table
    `CREATE POLICY "Users can read their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);`,

    `CREATE POLICY "Super admins can read all profiles"
      ON profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role::text = 'super_admin'
        )
      );`,

    `CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (
        auth.uid() = id AND
        (
          role IS NOT DISTINCT FROM OLD.role OR
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role::text = 'super_admin'
          )
        )
      );`,

    `CREATE POLICY "Super admins can update any profile"
      ON profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role::text = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role::text = 'super_admin'
        )
      );`,

    `CREATE POLICY "Allow profile creation during signup"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);`,

    `CREATE POLICY "Super admins can create any profile"
      ON profiles FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role::text = 'super_admin'
        )
      );`,

    `CREATE POLICY "Super admins can delete profiles"
      ON profiles FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role::text = 'super_admin'
        )
      );`,
  ];

  try {
    for (const sql of sqlCommands) {
      console.log("🔄 Executing:", sql.substring(0, 50) + "...");
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

      if (error) {
        console.error("❌ Error executing SQL:", error.message);
        // Continue with other commands even if one fails
      } else {
        console.log("✅ Success");
      }
    }

    // Verify policies were created
    console.log("\n📋 Verifying policies...");
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("policyname, cmd, permissive, roles, qual, with_check")
      .eq("tablename", "profiles")
      .order("cmd")
      .order("policyname");

    if (policiesError) {
      console.error("❌ Error fetching policies:", policiesError);
    } else {
      console.log("📋 Current policies for profiles table:");
      policies.forEach((policy) => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log("\n✅ Profiles RLS policies have been updated!");
    console.log("🔄 Please refresh your browser to see the changes.");
  } catch (error) {
    console.error("❌ Error fixing profiles RLS:", error);
  }
}

// Run the fix
fixProfilesRLS();
