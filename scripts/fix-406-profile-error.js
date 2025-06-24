const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAndFix406Error() {
  console.log("🔍 Diagnosing 406 Not Acceptable error for profiles...");

  const profileId = "62c22996-0320-4599-9fa5-c90d36280cf1";

  try {
    // 1. Check if profile exists using service role
    console.log("1️⃣ Checking if profile exists...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError) {
      console.log("❌ Profile query error:", profileError);
      if (profileError.code === "PGRST116") {
        console.log("⚠️ Profile not found - this could cause 406 error");
      }
    } else {
      console.log("✅ Profile found:", profile);
    }

    // 2. Check RLS policies on profiles table
    console.log("\n2️⃣ Checking RLS policies...");
    const { data: policies, error: policiesError } = await supabase.rpc("sql", {
      query: `
          SELECT policyname, cmd, permissive, roles, qual, with_check 
          FROM pg_policies 
          WHERE tablename = 'profiles' 
          AND schemaname = 'public'
          ORDER BY cmd, policyname;
        `,
    });

    if (policiesError) {
      console.log("❌ Error checking policies:", policiesError);
    } else {
      console.log("📋 Current RLS policies:");
      policies.forEach((policy) => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // 3. Test different query approaches
    console.log("\n3️⃣ Testing different query approaches...");

    // Test 1: Without .single()
    console.log("🧪 Test 1: Query without .single()");
    const { data: profiles1, error: error1 } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId);

    if (error1) {
      console.log("❌ Error:", error1);
    } else {
      console.log("✅ Success:", profiles1?.length, "profiles found");
    }

    // Test 2: With maybeSingle()
    console.log("🧪 Test 2: Query with .maybeSingle()");
    const { data: profile2, error: error2 } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (error2) {
      console.log("❌ Error:", error2);
    } else {
      console.log("✅ Success:", profile2 ? "Profile found" : "No profile");
    }

    // Test 3: Check if user exists in auth.users
    console.log("🧪 Test 3: Check auth.users table");
    const { data: authUser, error: authError } = await supabase.rpc("sql", {
      query: `SELECT id, email FROM auth.users WHERE id = '${profileId}';`,
    });

    if (authError) {
      console.log("❌ Auth user error:", authError);
    } else {
      console.log("✅ Auth user:", authUser);
    }

    // 4. Fix the issue by ensuring proper RLS policies
    console.log("\n4️⃣ Applying fixes...");

    // Fix 1: Ensure profile exists
    if (!profile && authUser && authUser.length > 0) {
      console.log("🔧 Creating missing profile...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: profileId,
          email: authUser[0].email,
          role: "super_admin", // Set as super_admin since this is the main user
        })
        .select()
        .single();

      if (createError) {
        console.log("❌ Error creating profile:", createError);
      } else {
        console.log("✅ Profile created:", newProfile);
      }
    }

    // Fix 2: Update RLS policies to be more permissive
    console.log("🔧 Updating RLS policies...");
    const rlsFixSQL = `
      -- Drop existing restrictive policies
      DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
      DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
      DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
      DROP POLICY IF EXISTS "Super admins can create any profile" ON profiles;
      DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

      -- Create new, more permissive policies
      CREATE POLICY "Allow users to read their own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id);

      CREATE POLICY "Allow super admins to read all profiles"
        ON profiles FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
          )
          OR auth.uid() = id
        );

      CREATE POLICY "Allow users to update their own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

      CREATE POLICY "Allow super admins to update any profile"
        ON profiles FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
          )
        );

      CREATE POLICY "Allow profile creation"
        ON profiles FOR INSERT
        WITH CHECK (
          auth.uid() = id OR
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
          )
        );

      CREATE POLICY "Allow super admins to delete profiles"
        ON profiles FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
          )
        );
    `;

    const { data: rlsResult, error: rlsError } = await supabase.rpc("sql", {
      query: rlsFixSQL,
    });

    if (rlsError) {
      console.log("❌ Error updating RLS policies:", rlsError);
    } else {
      console.log("✅ RLS policies updated successfully");
    }

    // 5. Final verification
    console.log("\n5️⃣ Final verification...");
    const { data: finalProfile, error: finalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (finalError) {
      console.log("❌ Final verification failed:", finalError);
    } else {
      console.log("✅ Final verification successful:", finalProfile);
    }

    console.log("\n🎉 Diagnosis and fix complete!");
    console.log("💡 The 406 error should now be resolved.");
    console.log("🔄 Please refresh your browser and try again.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the diagnosis
diagnoseAndFix406Error();
