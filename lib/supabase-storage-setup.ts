import { supabase } from "./supabase";

/**
 * Makes sure that the required storage buckets exist
 * and have the appropriate permissions
 */
export const setupStorage = async () => {
  try {
    // Check if brand-assets bucket exists
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

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
      const { error } = await supabase.storage.updateBucket("brand-assets", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error("Error updating brand-assets bucket:", error);
      }
    }

    // Set policy to allow public access
    const { error: policyError } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl("test.txt", 60);

    if (policyError && !policyError.message.includes("Object not found")) {
      console.error("Error testing storage access:", policyError);
    }
  } catch (error) {
    console.error("Error setting up storage:", error);
  }
};

export default setupStorage;
