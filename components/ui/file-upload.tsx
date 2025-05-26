"use client";

import React, { useState, useRef } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  defaultValue?: string;
  bucket?: string;
  path?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = "image/jpeg, image/png, image/webp",
  maxSizeMB = 5,
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a fallback bucket if the specified one doesn't exist
  const fallbackBucket = "brand-assets";

  // Direct upload to Supabase
  const uploadToSupabase = async (file: File): Promise<string> => {
    // Create a unique file name with original extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    console.log(`Attempting upload to bucket: ${bucket}, path: ${filePath}`);

    try {
      // Try uploading to the specified bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      // If there's an error, try the fallback bucket
      if (error) {
        console.warn(
          `Error uploading to ${bucket}, trying fallback bucket ${fallbackBucket}:`,
          error
        );

        // Try fallback bucket
        const fallbackResult = await supabase.storage
          .from(fallbackBucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (fallbackResult.error) {
          console.error(
            "Error uploading file to fallback bucket:",
            fallbackResult.error
          );
          throw fallbackResult.error;
        }

        // Get public URL from fallback bucket
        const { data: fallbackUrlData } = supabase.storage
          .from(fallbackBucket)
          .getPublicUrl(fallbackResult.data.path);

        return fallbackUrlData.publicUrl;
      }

      // Get public URL from original bucket
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload file
    setUploading(true);
    try {
      // Use direct Supabase upload
      const url = await uploadToSupabase(file);
      console.log("Upload successful, URL:", url);
      onUploadComplete(url);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error in file upload:", error);

      // More detailed error message
      let errorMessage = "Failed to upload file. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Upload error: ${error.message}`;
        console.log("Full error:", error);
      }

      toast.error(errorMessage);
      setPreview(defaultValue || null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-white h-8 w-8"
              onClick={handleButtonClick}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-white h-8 w-8"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleButtonClick}
          className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-10 w-10 text-gray-400" />
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">
                Click to upload an image
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG or WEBP (max. {maxSizeMB}MB)
              </p>
            </div>
            <Button
              type="button"
              className="mt-4 bg-oma-plum hover:bg-oma-plum/90"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Select Image"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
