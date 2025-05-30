// Setup script to create required Supabase storage buckets
const { createClient } = require("@supabase/supabase-js");

// Read environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase credentials are missing. Make sure .env.local is set up correctly."
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log("Listing existing buckets...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    console.log(
      "Current buckets:",
      buckets ? buckets.map((b) => b.name).join(", ") : "none"
    );

    // Create brand-assets bucket if it doesn't exist
    if (!buckets || !buckets.find((bucket) => bucket.name === "brand-assets")) {
      console.log("Creating brand-assets bucket");
      const { error } = await supabase.storage.createBucket("brand-assets", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error("Error creating brand-assets bucket:", error);
      } else {
        console.log("Created brand-assets bucket successfully");
      }
    } else {
      console.log("brand-assets bucket already exists");

      // Update the bucket to be public
      const { error } = await supabase.storage.updateBucket("brand-assets", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error("Error updating brand-assets bucket:", error);
      }
    }

    // Create profiles bucket if it doesn't exist
    if (!buckets || !buckets.find((bucket) => bucket.name === "profiles")) {
      console.log("Creating profiles bucket");
      const { error } = await supabase.storage.createBucket("profiles", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error("Error creating profiles bucket:", error);
      } else {
        console.log("Created profiles bucket successfully");
      }
    } else {
      console.log("profiles bucket already exists");

      // Update the profiles bucket to be public
      const { error } = await supabase.storage.updateBucket("profiles", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error("Error updating profiles bucket:", error);
      }
    }

    console.log("Storage setup completed!");
  } catch (error) {
    console.error("Error setting up storage:", error);
  }
}

console.log("Setting up Supabase storage buckets...");

// Run the setup
setupStorage()
  .then(() => {
    console.log("Storage setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during storage setup:", error);
    process.exit(1);
  });
