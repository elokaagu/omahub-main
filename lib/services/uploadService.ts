import { uploadPublicFile } from "@/lib/uploads/studioStorageUpload";
import { supabase } from "../supabase";

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = "brand-assets",
  path: string = "",
): Promise<string> {
  return uploadPublicFile({
    file,
    bucket,
    path,
    fallbackBuckets: bucket === "edition-galleries" ? ["brand-assets"] : [],
  });
}

/**
 * Delete a file from Supabase storage
 * @param filePath The full path of the file to delete
 * @param bucket The storage bucket name
 */
export async function deleteFile(
  filePath: string,
  bucket: string = "brand-assets",
): Promise<void> {
  try {
    const path = filePath.split(`${bucket}/`)[1];

    if (!path) {
      throw new Error("Invalid file path");
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteFile:", error);
    throw error;
  }
}
