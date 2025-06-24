const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProfilesRLS() {
  console.log("🔄 Fixing RLS policies for profiles table...");

  try {
    // First, let's check current policies
    console.log("📋 Checking current policies...");
    const { data: currentPolicies, error: checkError } = await supabase.rpc(
      "sql",
      {
        query: `
          SELECT policyname, cmd 
          FROM pg_policies 
          WHERE tablename = 'profiles'
          ORDER BY cmd, policyname;
        `,
      }
    );

    if (checkError) {
      console.log("⚠️ Could not check current policies:", checkError.message);
    } else {
      console.log("Current policies:", currentPolicies);
    }

    // Execute the SQL to fix policies
    const sqlCommands = `
      -- Drop existing policies that might be too restrictive
      DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON profiles;
      DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
      DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
      DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
      DROP POLICY IF EXISTS "Super admins can create any profile" ON profiles;
      DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

      -- Create comprehensive policies for profiles table

      -- 1. Users can read their own profile
      CREATE POLICY "Users can read their own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id);

      -- 2. Super admins can read all profiles
      CREATE POLICY "Super admins can read all profiles"
        ON profiles FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role::text = 'super_admin'
          )
        );

      -- 3. Users can update their own profile (but not role)
      CREATE POLICY "Users can update their own profile"
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
        );

      -- 4. Super admins can update any profile
      CREATE POLICY "Super admins can update any profile"
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
        );

      -- 5. Allow profile creation during signup
      CREATE POLICY "Allow profile creation during signup"
        ON profiles FOR INSERT
        WITH CHECK (auth.uid() = id);

      -- 6. Super admins can create profiles for other users
      CREATE POLICY "Super admins can create any profile"
        ON profiles FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role::text = 'super_admin'
          )
        );

      -- 7. Super admins can delete profiles
      CREATE POLICY "Super admins can delete profiles"
        ON profiles FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role::text = 'super_admin'
          )
        );
    `;

    console.log("🔄 Executing SQL to fix policies...");
    const { data, error } = await supabase.rpc("sql", {
      query: sqlCommands,
    });

    if (error) {
      console.error("❌ Error executing SQL:", error);
    } else {
      console.log("✅ SQL executed successfully");
    }

    // Verify policies were created
    console.log("\n📋 Verifying new policies...");
    const { data: newPolicies, error: verifyError } = await supabase.rpc(
      "sql",
      {
        query: `
          SELECT policyname, cmd 
          FROM pg_policies 
          WHERE tablename = 'profiles'
          ORDER BY cmd, policyname;
        `,
      }
    );

    if (verifyError) {
      console.error("❌ Error verifying policies:", verifyError);
    } else {
      console.log("📋 New policies for profiles table:");
      newPolicies.forEach((policy) => {
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
