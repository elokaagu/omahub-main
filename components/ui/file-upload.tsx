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

    debugLog(`Starting file upload`, LogLevel.INFO, {
      file: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      bucket,
      path: filePath,
    });

    // Retry mechanism for uploads
    const maxRetries = 2;
    let retryCount = 0;

    async function attemptUpload(
      currentBucket: string
    ): Promise<{ publicUrl: string; usedBucket: string }> {
      try {
        debugLog(
          `Attempting upload to bucket: ${currentBucket} (attempt ${
            retryCount + 1
          })`,
          LogLevel.DEBUG
        );
        const { data, error } = await supabase.storage
          .from(currentBucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(currentBucket)
          .getPublicUrl(data.path);

        debugLog(`Upload successful to ${currentBucket}`, LogLevel.INFO);
        return { publicUrl: urlData.publicUrl, usedBucket: currentBucket };
      } catch (error) {
        debugLog(
          `Error uploading to ${currentBucket}`,
          LogLevel.WARNING,
          extractErrorDetails(error)
        );
        throw error;
      }
    }

    try {
      // Try primary bucket first
      try {
        const result = await attemptUpload(bucket);
        return result.publicUrl;
      } catch (primaryError) {
        debugLog(
          `Primary bucket ${bucket} failed, trying fallback`,
          LogLevel.WARNING
        );

        // If primary bucket fails and we haven't exhausted retries, try fallback
        if (retryCount < maxRetries) {
          retryCount++;
          // Try fallback bucket
          try {
            const result = await attemptUpload(fallbackBucket);
            return result.publicUrl;
          } catch (fallbackError) {
            // If both primary and fallback fail, and we have retries left, try once more with primary
            if (retryCount < maxRetries) {
              retryCount++;
              // One last attempt with original bucket
              const result = await attemptUpload(bucket);
              return result.publicUrl;
            }
            throw fallbackError;
          }
        }
        throw primaryError;
      }
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      debugLog("All upload attempts failed", LogLevel.ERROR, errorDetails);
      setDebugInfo(JSON.stringify(errorDetails, null, 2));
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
      // Use direct Supabase upload
      debugLog(`Starting upload process`, LogLevel.INFO);
      const url = await uploadToSupabase(file);
      debugLog(`Upload completed successfully`, LogLevel.INFO, { url });
      onUploadComplete(url);
      toast.success("File uploaded successfully");
    } catch (error) {
      debugLog(`Upload failed`, LogLevel.ERROR, error);

      // More detailed error message
      let errorMessage = "Failed to upload file. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Upload error: ${error.message}`;
      }

      toast.error(errorMessage, {
        description: "Check browser console for details",
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

  const toggleDebugInfo = () => {
    // If debug info is not already set, gather system info
    if (!debugInfo) {
      const info = {
        browser: navigator.userAgent,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured",
        bucketRequested: bucket,
        timestamp: new Date().toISOString(),
      };
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
