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
  path: string = ""
): Promise<string> {
  try {
    // Create a unique file name with original extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage
 * @param filePath The full path of the file to delete
 * @param bucket The storage bucket name
 */
export async function deleteFile(
  filePath: string,
  bucket: string = "brand-assets"
): Promise<void> {
  try {
    // Extract the file path from the URL
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
