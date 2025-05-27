// Script to fix Supabase Storage RLS policies
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for this operation

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase credentials are missing. Make sure .env.local is set up correctly."
  );
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBucket(name, options = {}) {
  console.log(`Creating ${name} bucket...`);

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find((bucket) => bucket.name === name);

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket(name, {
        public: true,
        fileSizeLimit: options.fileSizeLimit || 10485760, // Default 10MB
        ...options,
      });

      if (error) {
        console.error(`Error creating ${name} bucket:`, error);
        return false;
      }
      console.log(`Successfully created ${name} bucket`);
    } else {
      console.log(`${name} bucket already exists`);
    }

    return true;
  } catch (error) {
    console.error(`Error in createStorageBucket for ${name}:`, error);
    return false;
  }
}

async function setupStoragePolicies() {
  try {
    console.log("Setting up storage policies...");

    // Create buckets
    const bucketsToCreate = [
      { name: "avatars", options: { fileSizeLimit: 5242880 } }, // 5MB limit for avatars
      { name: "brand-assets", options: { fileSizeLimit: 10485760 } }, // 10MB limit for brand assets
    ];

    for (const bucket of bucketsToCreate) {
      const success = await createStorageBucket(bucket.name, bucket.options);
      if (!success) {
        console.error(`Failed to create ${bucket.name} bucket`);
        continue;
      }

      // Set up policies for this bucket
      console.log(`Setting up policies for ${bucket.name} bucket...`);

      // 1. Policy for public SELECT access
      console.log(`Creating SELECT policy for ${bucket.name}...`);
      await supabase.rpc("create_storage_policy", {
        bucket_name: bucket.name,
        policy_name: `${bucket.name}_public_select`,
        definition: "true", // allow public access to read files
        operation: "SELECT",
        comment: `Allow public read access to ${bucket.name}`,
      });

      // 2. Policy for authenticated INSERT access
      console.log(`Creating INSERT policy for ${bucket.name}...`);
      await supabase.rpc("create_storage_policy", {
        bucket_name: bucket.name,
        policy_name: `${bucket.name}_auth_insert`,
        definition: "auth.role() = 'authenticated'", // only authenticated users can upload
        operation: "INSERT",
        comment: `Allow authenticated users to upload to ${bucket.name}`,
      });

      // 3. Policy for authenticated UPDATE access (for the file owner)
      console.log(`Creating UPDATE policy for ${bucket.name}...`);
      await supabase.rpc("create_storage_policy", {
        bucket_name: bucket.name,
        policy_name: `${bucket.name}_owner_update`,
        definition: "auth.uid() = owner", // only file owner can update
        operation: "UPDATE",
        comment: `Allow file owners to update their files in ${bucket.name}`,
      });

      // 4. Policy for authenticated DELETE access (for the file owner)
      console.log(`Creating DELETE policy for ${bucket.name}...`);
      await supabase.rpc("create_storage_policy", {
        bucket_name: bucket.name,
        policy_name: `${bucket.name}_owner_delete`,
        definition: "auth.uid() = owner", // only file owner can delete
        operation: "DELETE",
        comment: `Allow file owners to delete their files in ${bucket.name}`,
      });

      console.log(`Finished setting up policies for ${bucket.name}`);
    }

    console.log("Storage policy setup completed successfully!");
  } catch (error) {
    console.error("Error setting up storage policies:", error);
    throw error;
  }
}

// Run the script
setupStoragePolicies()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
