"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AuthImage } from "./auth-image";
import {
  generateBrandImageFilename,
  generateBrandImagePath,
  ImageNamingConfig,
} from "@/lib/services/imageNamingService";

interface SimpleFileUploadProps {
  onUploadComplete: (url: string) => void;
  defaultValue?: string;
  bucket?: string;
  path?: string;
  accept?: string;
  maxSize?: number;
  className?: string;
  // Brand-specific props for proper naming
  brandId?: string;
  brandName?: string;
  imageRole?: "logo" | "cover" | "gallery" | "thumbnail" | "hero" | "banner";
  imageType?: "brand" | "product" | "collection" | "user";
}

export function SimpleFileUpload({
  onUploadComplete,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = "image/jpeg,image/png,image/webp",
  maxSize = 5,
  className = "",
  brandId,
  brandName,
  imageRole = "cover",
  imageType = "brand",
}: SimpleFileUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);
  const [isTemporaryPreview, setIsTemporaryPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when defaultValue changes
  useEffect(() => {
    setPreview(defaultValue || null);
    setIsTemporaryPreview(false);
  }, [defaultValue]);

  // Simple upload function with better error handling
  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      // Prevent multiple simultaneous uploads
      if (uploading) {
        console.log("🔄 Upload already in progress, ignoring...");
        return preview || "";
      }

      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Check if supabase client is available
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please log in to upload files");
      }

      // Create filename using naming convention if brand info is provided
      let filename: string;
      let filePath: string;

      if (brandId && brandName && imageType === "brand") {
        // Use structured naming convention for brand images
        const namingConfig: ImageNamingConfig = {
          brandId,
          brandName,
          imageRole,
          imageType,
          userId: user.id,
        };

        filename = generateBrandImageFilename(namingConfig, file);
        filePath = generateBrandImagePath(namingConfig, filename);

        console.log("🏷️ Using structured naming:", {
          originalName: file.name,
          newFilename: filename,
          storagePath: filePath,
          brandId,
          brandName,
          imageRole,
        });
      } else {
        // Fallback to legacy naming for non-brand images
        const fileExtension = file.name.split(".").pop() || "jpg";
        filename = `${user.id.substring(0, 8)}_${Date.now()}.${fileExtension}`;
        filePath = path ? `${path}/${filename}` : filename;

        console.log("📁 Using legacy naming:", {
          originalName: file.name,
          newFilename: filename,
          storagePath: filePath,
        });
      }

      console.log("🔄 Starting upload:", {
        fileName: filename,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        bucket: bucket,
        path: filePath,
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error("❌ Upload error:", error);

        // Provide specific error messages
        if (
          error.message.includes("403") ||
          error.message.includes("Unauthorized")
        ) {
          throw new Error(
            "Upload permission denied. Please check your account permissions."
          );
        } else if (
          error.message.includes("404") ||
          error.message.includes("not found")
        ) {
          throw new Error(
            `Storage bucket '${bucket}' not found. Please contact support.`
          );
        } else if (error.message.includes("row-level security")) {
          throw new Error(
            "Database security policy blocked the upload. Please contact support."
          );
        } else if (error.message.includes("duplicate")) {
          throw new Error("File already exists. Please try again.");
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      if (!data?.path) {
        throw new Error("Upload succeeded but no file path returned");
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      console.log("✅ Upload successful:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      const errorMsg = `File is too large. Maximum size is ${maxSize}MB.`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file type
    const validTypes = accept.split(",").map((type) => type.trim());
    if (!validTypes.includes(file.type)) {
      const errorMsg = "Please select a valid image file (JPEG, PNG, or WebP).";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: `${fileSizeMB.toFixed(2)} MB`,
    });

    // Create temporary preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsTemporaryPreview(true);

    // Upload file
    setUploading(true);
    try {
      const url = await uploadToSupabase(file);

      // Clean up the temporary object URL
      URL.revokeObjectURL(objectUrl);

      // Update preview with the uploaded URL immediately
      setPreview(url);
      setIsTemporaryPreview(false);

      // Notify parent component
      onUploadComplete(url);
      toast.success("Image uploaded successfully!");

      console.log("✅ Preview updated with final URL:", url);
    } catch (error) {
      console.error("Upload failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);

      // Clean up the temporary object URL
      URL.revokeObjectURL(objectUrl);

      // Reset preview to default
      setPreview(defaultValue || null);
      setIsTemporaryPreview(false);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    // Clean up temporary preview if it exists
    if (isTemporaryPreview && preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setIsTemporaryPreview(false);
    setError(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-border">
            <AuthImage
              src={preview}
              alt="Upload preview"
              aspectRatio="square"
              className="w-full h-full object-cover"
              sizes="400px"
              quality={80}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={uploading}
            className="mb-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Max size: {maxSize}MB. Supported: JPEG, PNG, WebP
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <p className="text-sm text-blue-700">Uploading image...</p>
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
