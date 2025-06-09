const { createClient } = require("@supabase/supabase-js");

// Read environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Supabase credentials are missing. Make sure .env.local is set up correctly."
  );
  console.log("Required variables:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixBrandDeletionPolicy() {
  try {
    console.log("🔧 Fixing brand deletion policy...");

    // SQL to fix the brand deletion policy
    const fixPolicySQL = `
      -- Drop the existing restrictive delete policy
      DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;

      -- Create new delete policy that allows both admins and brand owners to delete
      CREATE POLICY "Enable delete for admins and brand owners"
      ON brands FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (
            profiles.role = 'admin'
            OR profiles.role = 'super_admin'
            OR (
              profiles.role = 'brand_admin'
              AND brands.id = ANY(profiles.owned_brands)
            )
          )
        )
      );
    `;

    console.log("📝 Executing SQL to fix brand deletion policy...");

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", {
      sql: fixPolicySQL,
    });

    if (error) {
      console.error("❌ Error executing SQL:", error);

      // Try alternative approach - execute each statement separately
      console.log("🔄 Trying alternative approach...");

      // Drop existing policy
      const { error: dropError } = await supabase.rpc("exec_sql", {
        sql: 'DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;',
      });

      if (dropError) {
        console.warn("⚠️ Could not drop existing policy:", dropError);
      } else {
        console.log("✅ Dropped existing restrictive policy");
      }

      // Create new policy
      const createPolicySQL = `
        CREATE POLICY "Enable delete for admins and brand owners"
        ON brands FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
              profiles.role = 'admin'
              OR profiles.role = 'super_admin'
              OR (
                profiles.role = 'brand_admin'
                AND brands.id = ANY(profiles.owned_brands)
              )
            )
          )
        );
      `;

      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: createPolicySQL,
      });

      if (createError) {
        console.error("❌ Error creating new policy:", createError);
        return;
      } else {
        console.log("✅ Created new brand deletion policy");
      }
    } else {
      console.log("✅ Brand deletion policy fixed successfully");
    }

    // Verify the policy was created
    console.log("🔍 Verifying policy...");
    const { data: policies, error: verifyError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT policyname, cmd, permissive, roles, qual 
        FROM pg_policies 
        WHERE tablename = 'brands' AND cmd = 'DELETE'
        ORDER BY policyname;
      `,
      }
    );

    if (verifyError) {
      console.warn("⚠️ Could not verify policy:", verifyError);
    } else {
      console.log("📋 Current brand deletion policies:", policies);
    }

    console.log("🎉 Brand deletion policy fix completed!");
    console.log(
      "✨ Brand owners should now be able to delete their own brands"
    );
  } catch (error) {
    console.error("❌ Error fixing brand deletion policy:", error);
  }
}

// Run the fix
fixBrandDeletionPolicy();
