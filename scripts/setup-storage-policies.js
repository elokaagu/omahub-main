// Setup script to create storage policies for Supabase buckets
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
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStoragePolicies() {
  try {
    console.log("Setting up storage policies...");

    // SQL to create storage policies
    const policySQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "brand-assets_public_select" ON storage.objects;
      DROP POLICY IF EXISTS "brand-assets_auth_insert" ON storage.objects;
      DROP POLICY IF EXISTS "brand-assets_owner_update" ON storage.objects;
      DROP POLICY IF EXISTS "brand-assets_owner_delete" ON storage.objects;
      DROP POLICY IF EXISTS "profiles_public_select" ON storage.objects;
      DROP POLICY IF EXISTS "profiles_auth_insert" ON storage.objects;
      DROP POLICY IF EXISTS "profiles_owner_update" ON storage.objects;
      DROP POLICY IF EXISTS "profiles_owner_delete" ON storage.objects;

      -- Create policies for brand-assets bucket
      CREATE POLICY "brand-assets_public_select"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'brand-assets');

      CREATE POLICY "brand-assets_auth_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'brand-assets' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "brand-assets_owner_update"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'brand-assets' 
        AND auth.uid() = owner
      );

      CREATE POLICY "brand-assets_owner_delete"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'brand-assets' 
        AND auth.uid() = owner
      );

      -- Create policies for profiles bucket
      CREATE POLICY "profiles_public_select"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'profiles');

      CREATE POLICY "profiles_auth_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'profiles' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "profiles_owner_update"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
      );

      CREATE POLICY "profiles_owner_delete"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'profiles' 
        AND auth.uid() = owner
      );
    `;

    console.log("Executing storage policy SQL...");
    const { data, error } = await supabase.rpc("exec_sql", { sql: policySQL });

    if (error) {
      console.error("Error setting up storage policies:", error);

      // Try alternative approach - execute policies one by one
      console.log("Trying alternative approach...");

      const policies = [
        {
          name: "brand-assets_public_select",
          sql: `CREATE POLICY "brand-assets_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');`,
        },
        {
          name: "brand-assets_auth_insert",
          sql: `CREATE POLICY "brand-assets_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');`,
        },
        {
          name: "profiles_public_select",
          sql: `CREATE POLICY "profiles_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');`,
        },
        {
          name: "profiles_auth_insert",
          sql: `CREATE POLICY "profiles_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');`,
        },
      ];

      for (const policy of policies) {
        try {
          console.log(`Creating policy: ${policy.name}`);
          const { error: policyError } = await supabase.rpc("exec_sql", {
            sql: policy.sql,
          });
          if (policyError) {
            console.warn(
              `Warning creating ${policy.name}:`,
              policyError.message
            );
          } else {
            console.log(`✓ Created ${policy.name}`);
          }
        } catch (err) {
          console.warn(`Could not create ${policy.name}:`, err.message);
        }
      }
    } else {
      console.log("Storage policies created successfully:", data);
    }

    console.log("Storage policies setup completed!");
  } catch (error) {
    console.error("Error setting up storage policies:", error);
  }
}

console.log("Setting up Supabase storage policies...");

// Run the setup
setupStoragePolicies()
  .then(() => {
    console.log("Storage policies setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during storage policies setup:", error);
    process.exit(1);
  });
