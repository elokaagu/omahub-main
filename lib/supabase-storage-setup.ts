import { supabase } from "./supabase";

// Flag to check if we're in build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

/**
 * Makes sure that the required storage buckets exist
 * and have the appropriate permissions
 */
export const setupStorage = async () => {
  // Skip actual storage operations during build time
  if (isBuildTime) {
    console.log("Running in build process - skipping actual storage setup");
    return;
  }

  try {
    console.log("Setting up storage buckets...");

    // Check if buckets exist
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    console.log(
      "Found existing buckets:",
      buckets.map((b) => b.name).join(", ") || "none"
    );

    // Create brand-assets bucket if it doesn't exist
    if (!buckets.find((bucket) => bucket.name === "brand-assets")) {
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
      try {
        const { error } = await supabase.storage.updateBucket("brand-assets", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) {
          console.error("Error updating brand-assets bucket:", error);
        } else {
          console.log("Updated brand-assets bucket successfully");
        }
      } catch (updateError) {
        console.warn("Could not update brand-assets bucket:", updateError);
      }
    }

    // Create profiles bucket if it doesn't exist
    if (!buckets.find((bucket) => bucket.name === "profiles")) {
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
      try {
        const { error } = await supabase.storage.updateBucket("profiles", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });

        if (error) {
          console.error("Error updating profiles bucket:", error);
        } else {
          console.log("Updated profiles bucket successfully");
        }
      } catch (updateError) {
        console.warn("Could not update profiles bucket:", updateError);
      }
    }

    // Test that the buckets are accessible
    console.log("Testing storage access...");

    try {
      // Set policy to allow public access for brand-assets
      const { data: brandTestData, error: brandPolicyError } =
        await supabase.storage
          .from("brand-assets")
          .upload("test-access.txt", new Blob(["test"]), {
            upsert: true,
          });

      if (brandPolicyError) {
        console.warn(
          "Error testing brand-assets storage access:",
          brandPolicyError
        );
      } else {
        console.log("Successfully accessed brand-assets bucket");
        // Clean up test file
        await supabase.storage.from("brand-assets").remove(["test-access.txt"]);
      }
    } catch (brandTestError) {
      console.warn("Could not test brand-assets bucket:", brandTestError);
    }

    try {
      // Set policy to allow public access for profiles
      const { data: profileTestData, error: profilePolicyError } =
        await supabase.storage
          .from("profiles")
          .upload("test-access.txt", new Blob(["test"]), {
            upsert: true,
          });

      if (profilePolicyError) {
        console.warn(
          "Error testing profiles storage access:",
          profilePolicyError
        );
      } else {
        console.log("Successfully accessed profiles bucket");
        // Clean up test file
        await supabase.storage.from("profiles").remove(["test-access.txt"]);
      }
    } catch (profileTestError) {
      console.warn("Could not test profiles bucket:", profileTestError);
    }

    console.log("Storage setup completed successfully");
  } catch (error) {
    console.error("Error setting up storage:", error);
    throw error;
  }
};

export default setupStorage;
