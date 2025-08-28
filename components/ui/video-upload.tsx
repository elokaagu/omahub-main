"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Upload, X, Video, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
  defaultValue?: string;
  bucket?: string;
  path?: string;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function VideoUpload({
  onUploadComplete,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = "video/mp4,video/webm,video/quicktime",
  maxSize = 50,
  className = "",
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);
  const [isTemporaryPreview, setIsTemporaryPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when defaultValue changes
  useEffect(() => {
    setPreview(defaultValue || null);
    setIsTemporaryPreview(false);
  }, [defaultValue]);

  // Upload function with progress tracking
  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
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
        throw new Error("Please log in to upload videos");
      }

      // Check permissions based on bucket
      if (bucket === "spotlight-videos") {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile check failed");
        }

        if (profile.role !== "super_admin") {
          throw new Error("Only super admins can upload spotlight videos");
        }
      } else if (bucket === "product-videos") {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile check failed");
        }

        const canUpload = ["super_admin", "admin", "brand_admin"].includes(
          profile.role
        );
        if (!canUpload) {
          throw new Error("Insufficient permissions to upload product videos");
        }
      }

      // Create unique filename
      const fileExtension = file.name.split(".").pop() || "mp4";
      const uniqueFileName = `${user.id.substring(0, 8)}_${Date.now()}.${fileExtension}`;
      const filePath = path ? `${path}/${uniqueFileName}` : uniqueFileName;

      console.log("🎬 Starting video upload:", {
        fileName: uniqueFileName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        bucket: bucket,
        path: filePath,
      });

      // Upload file with progress tracking
          const { data, error } = await supabase.storage
      .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Video upload error:", error);

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
        throw new Error("Failed to get public URL for uploaded video");
      }

      console.log("✅ Video upload successful:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Video upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);
    setUploadProgress(0);

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      const errorMsg = `Video is too large. Maximum size is ${maxSize}MB.`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file type
    const validTypes = accept.split(",").map((type) => type.trim());
    if (!validTypes.includes(file.type)) {
      const errorMsg =
        "Please select a valid video file (MP4, WebM, or QuickTime).";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log("🎬 Video file selected:", {
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
      toast.success("Video uploaded successfully!");

      console.log("✅ Preview updated with final URL:", url);
    } catch (error) {
      console.error("Video upload failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload video. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);

      // Clean up the temporary object URL
      URL.revokeObjectURL(objectUrl);

      // Reset preview to default
      setPreview(defaultValue || null);
      setIsTemporaryPreview(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
    setUploadProgress(0);
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
          <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border">
            <video
              src={preview}
              controls
              className="w-full h-auto max-h-64 object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
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
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
                Choose Video
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Max size: {maxSize}MB. Supported: MP4, WebM, QuickTime
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
            <p className="text-sm text-blue-700">Uploading video...</p>
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
