"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AuthImage } from "./auth-image";
import { MediaPicker } from "@/components/studio/MediaPicker";
import { MediaDropzone } from "./media-dropzone";
import {
  acceptAttribute,
  isAcceptedFile,
  isHeicLikeFile,
} from "@/lib/uploads/acceptedMedia";
import {
  ensureValidSession,
  uploadPublicFile,
} from "@/lib/uploads/studioStorageUpload";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  defaultValue?: string;
  bucket?: string;
  path?: string;
  accept?: string | Record<string, string[]>;
  maxSize?: number;
  className?: string;
  hidePreview?: boolean;
  compact?: boolean;
  inputId?: string;
  /** Studio only: offer images already uploaded to OmaHub as well. */
  allowLibrary?: boolean;
}

export function FileUpload({
  onUploadComplete,
  allowLibrary = false,
  onUploadStart,
  onUploadProgress,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = {
    "image/jpeg": [".jpg", ".jpeg", ".jpe", ".jfif"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  },
  maxSize = 5,
  className = "",
  hidePreview = false,
  compact = false,
  inputId,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [imageError, setImageError] = useState(false);
  const [isTemporaryPreview, setIsTemporaryPreview] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when defaultValue changes
  useEffect(() => {
    setPreview(defaultValue || null);
    setImageError(false); // Reset error state when defaultValue changes
    setIsTemporaryPreview(false);
  }, [defaultValue]);

  const acceptString = acceptAttribute(accept);

  const assertBucketPermission = async (userId: string) => {
    if (!supabase) {
      throw new Error("Upload unavailable. Sign in again and retry.");
    }

    if (bucket !== "spotlight-images" && bucket !== "product-images") {
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error(
        profileError
          ? `Profile check failed: ${profileError.message}`
          : "User profile not found",
      );
    }

    if (bucket === "spotlight-images" && profile.role !== "super_admin") {
      throw new Error(
        `Only super admins can upload spotlight images. Your role: ${profile.role}`,
      );
    }

    if (
      bucket === "product-images" &&
      !["super_admin", "admin", "brand_admin"].includes(profile.role)
    ) {
      throw new Error(
        `Only super admins, admins, and brand admins can upload product images. Your role: ${profile.role}`,
      );
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const { userId } = await ensureValidSession();
    await assertBucketPermission(userId);

    return uploadPublicFile({
      file,
      bucket,
      path,
      fallbackBuckets: bucket === "edition-galleries" ? ["brand-assets"] : [],
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
      input.value = "";
      return;
    }

    if (isHeicLikeFile(file)) {
      toast.error(
        "iPhone HEIC photos aren’t supported. Export or share the image as JPG or PNG, then upload that file.",
      );
      input.value = "";
      return;
    }

    if (!isAcceptedFile(file, accept)) {
      toast.error("That file type isn’t supported. Try a JPG, JPEG, PNG, or WebP.");
      input.value = "";
      return;
    }

    // Create temporary preview and mark it as such
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsTemporaryPreview(true);
    setImageError(false); // Reset any previous errors
    setUploadProgress(0); // Reset progress

    // Notify upload start
    onUploadStart?.();

    // Upload file
    setUploading(true);
    try {
      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev; // Don't go to 100% until actually complete
          const newProgress = prev + Math.random() * 15;
          onUploadProgress?.(newProgress);
          return newProgress;
        });
      }, 200);

      const url = await uploadToSupabase(file);

      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      onUploadProgress?.(100);

      // Update preview with the uploaded URL and mark as permanent
      setPreview(url);
      setIsTemporaryPreview(false);
      setImageError(false);

      onUploadComplete(url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("image upload error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.";
      toast.error(errorMessage);
      setPreview(defaultValue || null);
      setIsTemporaryPreview(false);
      setUploadProgress(0);
      onUploadProgress?.(0);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      input.value = "";
    }
  };

  const handleLibrarySelect = (url: string) => {
    setPreview(url);
    setImageError(false);
    setIsTemporaryPreview(false);
    onUploadComplete(url);
    toast.success("Image selected");
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setImageError(false);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageError = () => {
    // Only set error if this is not a temporary preview during upload
    if (!isTemporaryPreview && !uploading) {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {allowLibrary && (
        <MediaPicker
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onSelect={handleLibrarySelect}
          preferredBucket={bucket}
        />
      )}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {preview && !imageError && !hidePreview ? (
        <div className="relative">
          <AuthImage
            src={preview}
            alt="Preview"
            width={300}
            height={200}
            className="w-full h-48 object-cover rounded-md border border-gray-200"
            isUploading={uploading}
            uploadProgress={uploadProgress}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
          {/* Hidden image to detect loading errors - only for permanent URLs */}
          {!isTemporaryPreview && (
            <img
              src={preview}
              alt=""
              className="hidden"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
        </div>
      ) : (
        <MediaDropzone
          icon={ImageIcon}
          title={
            preview && hidePreview ? "Replace image" : "Click to upload an image"
          }
          hint={`PNG, JPG or WEBP (max. ${maxSize}MB)`}
          compact={compact}
          onClick={uploading ? undefined : handleButtonClick}
        >
          {uploading ? (
            <div className="w-full space-y-3">
              <p className="text-sm font-medium text-oma-plum">
                Image is uploading...
              </p>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-oma-plum transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          ) : (
            <>
              <Button
                type="button"
                className="bg-oma-plum hover:bg-oma-plum/90"
                disabled={uploading}
                onClick={(event) => {
                  event.stopPropagation();
                  handleButtonClick();
                }}
              >
                {preview && hidePreview ? "Change Image" : "Select Image"}
              </Button>
              {allowLibrary && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={(event) => {
                    event.stopPropagation();
                    setLibraryOpen(true);
                  }}
                >
                  <ImageIcon className="mr-2 h-4 w-4" aria-hidden />
                  Choose existing
                </Button>
              )}
            </>
          )}
        </MediaDropzone>
      )}
      {imageError && preview && !isTemporaryPreview && (
        <p className="text-xs text-red-500">
          Image failed to load. Please upload a new one.
        </p>
      )}
    </div>
  );
}
