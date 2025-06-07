// Setup script to create the hero-images bucket for hero slide uploads
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

async function setupHeroImagesBucket() {
  try {
    console.log("Setting up hero-images bucket...");

    // List existing buckets
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

    // Create hero-images bucket if it doesn't exist
    if (!buckets || !buckets.find((bucket) => bucket.name === "hero-images")) {
      console.log("Creating hero-images bucket");
      const { data, error } = await supabase.storage.createBucket(
        "hero-images",
        {
          public: true,
          fileSizeLimit: 20971520, // 20MB limit for high-res hero images
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        }
      );

      if (error) {
        console.error("Error creating hero-images bucket:", error);
        return;
      } else {
        console.log("Created hero-images bucket successfully:", data);
      }
    } else {
      console.log("hero-images bucket already exists");
    }

    // Test upload to hero-images bucket
    console.log("Testing upload to hero-images bucket...");
    const testFile = new Blob(["test content"], { type: "text/plain" });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("hero-images")
      .upload("test-upload.txt", testFile);

    if (uploadError) {
      console.error("Upload test failed:", uploadError);
    } else {
      console.log("Upload test successful:", uploadData);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from("hero-images")
        .remove(["test-upload.txt"]);

      if (deleteError) {
        console.warn("Could not clean up test file:", deleteError);
      } else {
        console.log("Test file cleaned up successfully");
      }
    }

    console.log("Hero images bucket setup completed!");
  } catch (error) {
    console.error("Error setting up hero-images bucket:", error);
  }
}

// Run the setup
setupHeroImagesBucket();
