"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AuthImage } from "./auth-image";

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
}

export function FileUpload({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = "image/jpeg, image/png, image/webp",
  maxSize = 5,
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [imageError, setImageError] = useState(false);
  const [isTemporaryPreview, setIsTemporaryPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when defaultValue changes
  useEffect(() => {
    setPreview(defaultValue || null);
    setImageError(false); // Reset error state when defaultValue changes
    setIsTemporaryPreview(false);
  }, [defaultValue]);

  // Process accept parameter to handle both string and object formats
  const acceptString =
    typeof accept === "string"
      ? accept
      : Object.entries(accept)
          .map(([mimeType, extensions]) => extensions.join(", "))
          .join(", ");

  // Simplified upload to Supabase with timeout
  const uploadToSupabase = async (file: File): Promise<string> => {
    // Check if supabase client is available
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Force session refresh to ensure we have a valid token
    console.log("🔄 Refreshing session for upload...");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.refreshSession();

    if (sessionError) {
      console.error("Session refresh failed:", sessionError);
      throw new Error(`Session refresh failed: ${sessionError.message}`);
    }

    // Check if user is authenticated after refresh
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication check failed:", {
        authError,
        hasUser: !!user,
      });
      throw new Error(
        `Authentication required: Please log in to upload files. ${authError?.message || "No user session found"}`
      );
    }

    console.log("Upload authentication successful:", {
      userId: user.id,
      email: user.email,
      bucket: bucket,
    });

    // Special handling for spotlight-images bucket
    if (bucket === "spotlight-images") {
      console.log("🎯 Spotlight upload: Checking user permissions...");
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile check failed:", profileError);
          throw new Error(`Profile check failed: ${profileError.message}`);
        }

        if (!profile) {
          throw new Error("User profile not found");
        }

        console.log("User profile:", profile);

        // Check if user has permission to upload spotlight images
        const canUploadSpotlight = profile.role === "super_admin";

        if (!canUploadSpotlight) {
          throw new Error(
            `Insufficient permissions: Only super admins can upload spotlight images. Your role: ${profile.role}`
          );
        }

        console.log("✅ Spotlight upload permission verified");
      } catch (permissionError) {
        console.error("Permission check error:", permissionError);
        throw permissionError;
      }
    }

    // Check user profile and permissions for product uploads
    if (bucket === "product-images") {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, owned_brands")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw new Error(`Profile check failed: ${profileError.message}`);
        }

        if (!profile) {
          throw new Error("User profile not found");
        }

        // Check if user has permission to upload product images
        const canUploadProducts =
          profile.role === "super_admin" ||
          profile.role === "admin" ||
          profile.role === "brand_admin";

        if (!canUploadProducts) {
          throw new Error(
            `Insufficient permissions: Only super admins, admins, and brand admins can upload product images. Your role: ${profile.role}`
          );
        }
      } catch (permissionError) {
        throw permissionError;
      }
    }

    // Create unique filename with user ID prefix
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${user.id.substring(0, 8)}_${Date.now()}.${fileExtension}`;

    console.log("Starting upload:", {
      fileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
      bucket: bucket,
    });

    // Upload with timeout
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Upload timeout after 30 seconds")),
        30000
      )
    );

    const { data, error } = (await Promise.race([
      uploadPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      console.error("Upload error:", error);

      // Provide more specific error messages
      if (
        error.message.includes("403") ||
        error.message.includes("Unauthorized")
      ) {
        throw new Error(
          `Upload unauthorized: You may not have permission to upload to the ${bucket} bucket. Please ensure you are logged in with the correct permissions.`
        );
      } else if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        throw new Error(
          `Storage bucket '${bucket}' not found. Please contact support to set up the storage bucket.`
        );
      } else if (error.message.includes("row-level security")) {
        // Special handling for RLS errors
        if (bucket === "spotlight-images") {
          throw new Error(
            `Database security policy blocked the spotlight upload. This usually means you need to sign out and sign back in to refresh your session. Your current role should be 'super_admin'.`
          );
        } else {
          throw new Error(
            `Database security policy blocked the upload. Please ensure you have the correct permissions for ${bucket} bucket.`
          );
        }
      } else if (
        error.message.includes("mime type") &&
        error.message.includes("not supported")
      ) {
        throw new Error(
          `File type not supported. Please upload a valid image file (JPEG, PNG, or WebP).`
        );
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }

    if (!data?.path) {
      throw new Error("Upload succeeded but no file path returned");
    }

    console.log("Upload successful:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    console.log("Public URL generated:", urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP).");
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
      // More specific error messages
      let errorMessage = "Failed to upload image. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage =
            "Upload timed out. Please check your connection and try again.";
        } else if (error.message.includes("storage")) {
          errorMessage = "Storage error. Please try again or contact support.";
        } else {
          errorMessage = `Upload error: ${error.message}`;
        }
      }

      toast.error(errorMessage);
      setPreview(defaultValue || null);
      setIsTemporaryPreview(false);
      setUploadProgress(0);
      onUploadProgress?.(0);
    } finally {
      setUploading(false);
      // Clean up the temporary object URL
      URL.revokeObjectURL(objectUrl);
    }
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
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {preview && !imageError ? (
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
                PNG, JPG or WEBP (max. {maxSize}MB)
              </p>
              {imageError && preview && !isTemporaryPreview && (
                <p className="text-xs text-red-500 mt-1">
                  Image failed to load. Please upload a new one.
                </p>
              )}
            </div>

            {uploading ? (
              <div className="w-full mt-4 space-y-3">
                <p className="text-sm text-oma-plum font-medium">
                  Image is uploading...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-oma-plum h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            ) : (
              <Button
                type="button"
                className="mt-4 bg-oma-plum hover:bg-oma-plum/90"
                disabled={uploading}
              >
                Select Image
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
