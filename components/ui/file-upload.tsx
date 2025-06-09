"use client";

import React, { useState, useRef } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { debugLog, LogLevel, extractErrorDetails } from "@/lib/debug-utils";
import { AuthImage } from "./auth-image";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  defaultValue?: string;
  bucket?: string;
  path?: string;
  accept?: string | Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  defaultValue,
  bucket = "brand-assets",
  path = "",
  accept = "image/jpeg, image/png, image/webp",
  maxSize = 5,
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      debugLog(`Authentication check failed`, LogLevel.ERROR, {
        authError: authError?.message,
        hasUser: !!user,
      });
      throw new Error(
        `Authentication required: ${authError?.message || "No user session"}`
      );
    }

    debugLog(`User authenticated`, LogLevel.INFO, {
      userId: user.id,
      userEmail: user.email,
    });

    // Create a unique file name with original extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    debugLog(`Starting file upload`, LogLevel.INFO, {
      file: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      bucket,
      path: filePath,
      userId: user.id,
    });

    // Create a timeout promise with dynamic timeout based on file size
    // Base timeout of 60 seconds + 30 seconds per MB for large files
    const fileSizeMB = file.size / (1024 * 1024);
    const timeoutDuration = Math.max(60000, 60000 + fileSizeMB * 30000); // Min 60s, +30s per MB

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `Upload timeout after ${Math.round(timeoutDuration / 1000)} seconds`
            )
          ),
        timeoutDuration
      );
    });

    try {
      // Race between upload and timeout
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      const { data, error } = (await Promise.race([
        uploadPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        debugLog(`Upload error`, LogLevel.ERROR, {
          ...extractErrorDetails(error),
          bucket,
          filePath,
          userId: user.id,
        });

        // Provide more specific error messages
        if (
          error.message?.includes("Unauthorized") ||
          error.statusCode === "403"
        ) {
          throw new Error(
            `Upload unauthorized: You may not have permission to upload to the ${bucket} bucket. Please check your account permissions.`
          );
        } else if (
          error.message?.includes("not found") ||
          error.statusCode === "404"
        ) {
          throw new Error(
            `Storage bucket '${bucket}' not found. Please contact support.`
          );
        } else {
          throw error;
        }
      }

      if (!data) {
        throw new Error("No data returned from upload");
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      debugLog(`Upload successful`, LogLevel.INFO, {
        path: data.path,
        url: urlData.publicUrl,
        userId: user.id,
      });

      return urlData.publicUrl;
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      debugLog("Upload failed", LogLevel.ERROR, {
        ...errorDetails,
        bucket,
        filePath,
        userId: user?.id,
      });
      setDebugInfo(
        JSON.stringify(
          {
            ...errorDetails,
            bucket,
            filePath,
            userId: user?.id,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset debug info
    setDebugInfo(null);

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

    debugLog(`File selected`, LogLevel.INFO, {
      name: file.name,
      type: file.type,
      size: `${fileSizeMB.toFixed(2)} MB`,
    });

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload file
    setUploading(true);
    try {
      debugLog(`Starting upload process`, LogLevel.INFO);
      const url = await uploadToSupabase(file);
      debugLog(`Upload completed successfully`, LogLevel.INFO, { url });
      onUploadComplete(url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      debugLog(`Upload failed`, LogLevel.ERROR, error);

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

      toast.error(errorMessage, {
        description: "Check the debug info below for more details",
        duration: 5000,
      });
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
    setDebugInfo(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleDebugInfo = async () => {
    // If debug info is not already set, gather system info
    if (!debugInfo) {
      const info: any = {
        browser: navigator.userAgent,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured",
        bucketRequested: bucket,
        timestamp: new Date().toISOString(),
        supabaseClient: !!supabase ? "Connected" : "Not connected",
      };

      // Test authentication
      if (supabase) {
        try {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();
          if (authError) {
            info.authTest = `Error: ${authError.message}`;
            info.userAuthenticated = false;
          } else if (user) {
            info.authTest = "Success - User authenticated";
            info.userAuthenticated = true;
            info.userId = user.id;
            info.userEmail = user.email;
          } else {
            info.authTest = "No user session found";
            info.userAuthenticated = false;
          }
        } catch (error) {
          info.authTest = `Exception: ${error instanceof Error ? error.message : "Unknown error"}`;
          info.userAuthenticated = false;
        }
      } else {
        info.authTest = "Supabase client not available";
        info.userAuthenticated = false;
      }

      // Test storage connection
      if (supabase) {
        try {
          const { data: buckets, error } = await supabase.storage.listBuckets();
          if (error) {
            info.storageTest = `Error: ${error.message}`;
          } else {
            info.storageTest = `Success - Found ${buckets?.length || 0} buckets`;
            info.availableBuckets = buckets?.map((b) => b.name) || [];
            info.targetBucketExists =
              buckets?.some((b) => b.name === bucket) || false;
          }
        } catch (error) {
          info.storageTest = `Exception: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      } else {
        info.storageTest = "Supabase client not available";
      }

      setDebugInfo(JSON.stringify(info, null, 2));
    } else {
      setDebugInfo(null);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptString}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200">
          <AuthImage
            src={preview}
            alt="Preview"
            width={800}
            height={600}
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
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                <p className="text-sm">Uploading...</p>
              </div>
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
                PNG, JPG or WEBP (max. {maxSize}MB)
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

      {/* Debug Button */}
      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={toggleDebugInfo}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          {debugInfo ? "Hide Debug Info" : "Show Debug Info"}
        </button>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-200 overflow-auto">
          <h4 className="text-xs font-bold mb-1">Debug Information:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
}
