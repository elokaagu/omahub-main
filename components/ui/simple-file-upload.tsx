"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthImage } from "./auth-image";
import {
  generateBrandImageFilename,
  generateBrandImagePath,
  ImageNamingConfig,
} from "@/lib/services/imageNamingService";
import {
  isAcceptedFile,
  isHeicLikeFile,
} from "@/lib/uploads/acceptedMedia";
import { uploadPublicFile } from "@/lib/uploads/studioStorageUpload";
import { exceedsPickerSizeLimit } from "@/lib/uploads/optimizeImage";
import { MediaDropzone } from "./media-dropzone";

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
  maxSize = 20,
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

  const uploadToSupabase = async (file: File): Promise<string> => {
    setUploadProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      let storagePath: string | undefined;

      if (brandId && brandName && imageType === "brand") {
        const namingConfig: ImageNamingConfig = {
          brandId,
          brandName,
          imageRole,
          imageType,
        };
        const filename = generateBrandImageFilename(namingConfig, file);
        storagePath = generateBrandImagePath(namingConfig, filename);
      }

      const url = await uploadPublicFile({
        file,
        bucket,
        path,
        storagePath,
        fallbackBuckets: bucket === "edition-galleries" ? ["brand-assets"] : [],
        maxSizeMb: maxSize,
        requireImage: true,
      });

      setUploadProgress(100);
      return url;
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    const fileSizeMB = file.size / (1024 * 1024);
    if (exceedsPickerSizeLimit(file, maxSize)) {
      const errorMsg = `File is too large. Maximum size is ${maxSize}MB.`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (isHeicLikeFile(file)) {
      const errorMsg =
        "iPhone HEIC photos aren’t supported. Export or share the image as JPG or PNG, then upload that file.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!isAcceptedFile(file, accept)) {
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
        <MediaDropzone
          icon={ImageIcon}
          title="Click to upload an image"
          hint={`PNG, JPG or WEBP (max. ${maxSize}MB)`}
          onClick={uploading ? undefined : handleButtonClick}
        >
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={(event) => {
              event.stopPropagation();
              handleButtonClick();
            }}
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>
        </MediaDropzone>
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
