import { supabase } from "../supabase";

/**
 * Get a signed URL for a private image
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns The signed URL for the image
 */
export async function getSignedImageUrl(
  bucket: string,
  path: string
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiration

    if (error) {
      console.error("Error getting signed URL:", error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getSignedImageUrl:", error);
    throw error;
  }
}

/**
 * Convert a public URL to a signed URL
 * @param publicUrl The public URL of the image
 * @returns The signed URL for the image
 */
export async function convertToSignedUrl(publicUrl: string): Promise<string> {
  try {
    // Extract bucket and path from public URL
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/");
    if (pathParts.length !== 2) {
      throw new Error("Invalid storage URL format");
    }

    const [bucket, ...pathSegments] = pathParts[1].split("/");
    const path = pathSegments.join("/");

    return await getSignedImageUrl(bucket, path);
  } catch (error) {
    console.error("Error converting to signed URL:", error);
    throw error;
  }
}
