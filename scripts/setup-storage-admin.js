// Setup script to create required Supabase storage buckets using service role
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

async function setupStorage() {
  try {
    console.log("Setting up storage with service role...");
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
      const { data, error } = await supabase.storage.createBucket(
        "brand-assets",
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
        }
      );

      if (error) {
        console.error("Error creating brand-assets bucket:", error);
      } else {
        console.log("Created brand-assets bucket successfully:", data);
      }
    } else {
      console.log("brand-assets bucket already exists");
    }

    // Create profiles bucket if it doesn't exist
    if (!buckets || !buckets.find((bucket) => bucket.name === "profiles")) {
      console.log("Creating profiles bucket");
      const { data, error } = await supabase.storage.createBucket("profiles", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });

      if (error) {
        console.error("Error creating profiles bucket:", error);
      } else {
        console.log("Created profiles bucket successfully:", data);
      }
    } else {
      console.log("profiles bucket already exists");
    }

    // Test upload to brand-assets bucket
    console.log("Testing upload to brand-assets bucket...");
    const testFile = new Blob(["test content"], { type: "text/plain" });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload("test-upload.txt", testFile);

    if (uploadError) {
      console.error("Upload test failed:", uploadError);
    } else {
      console.log("Upload test successful:", uploadData);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from("brand-assets")
        .remove(["test-upload.txt"]);

      if (deleteError) {
        console.warn("Could not clean up test file:", deleteError);
      } else {
        console.log("Test file cleaned up successfully");
      }
    }

    console.log("Storage setup completed!");
  } catch (error) {
    console.error("Error setting up storage:", error);
  }
}

console.log("Setting up Supabase storage buckets with admin privileges...");

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
