import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/server-supabase";

// Mark this route as server-side only
export const dynamic = "force-dynamic";
// Disable static generation for this route
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Simple CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json",
};

// Handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * API endpoint for diagnosing upload issues
 */
export async function GET(request: NextRequest) {
  console.log("Upload test diagnostic API called");

  try {
    // Try to get a signed URL
    const { data: signedUrl, error: signedError } = await serverSupabase.storage
      .from("brand-assets")
      .createSignedUrl("test-image.jpg", 60);

    if (signedError) {
      return NextResponse.json(
        { success: false, error: signedError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, signedUrl });
  } catch (error) {
    console.error("Test auth image error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Define types for the test results
interface StorageSetupResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface BucketTestResult {
  success: boolean;
  initialBuckets?: any[];
  setupResult?: StorageSetupResult;
  bucketsAfterSetup?: any[];
  bucketsError?: string | null;
  updatedBucketsError?: string | null;
  error?: string;
  details?: any;
}

interface StorageTestResult {
  success: boolean;
  message: string;
  error: any;
  uploadResult?: any;
  deleteError?: string | null;
}

interface RLSTestItemResult {
  success: boolean;
  data: string;
  error: string | null;
}

interface RLSTestResult {
  objects: RLSTestItemResult;
  buckets: RLSTestItemResult;
  success?: boolean;
  error?: string;
}

/**
 * Test the existence and status of storage buckets
 */
async function testStorageBuckets(): Promise<BucketTestResult> {
  try {
    // Try to list all buckets
    const { data: bucketsData, error: bucketsError } =
      await serverSupabase.storage.listBuckets();

    if (bucketsError) {
      return {
        success: false,
        error: String(bucketsError),
        details: bucketsError,
      };
    }

    // List buckets again after setup
    const { data: updatedBucketsData, error: updatedBucketsError } =
      await serverSupabase.storage.listBuckets();

    return {
      success: !bucketsError && !updatedBucketsError,
      initialBuckets: bucketsData || [],
      bucketsAfterSetup: updatedBucketsData || [],
      bucketsError: bucketsError ? String(bucketsError) : null,
      updatedBucketsError: updatedBucketsError
        ? String(updatedBucketsError)
        : null,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Test storage permissions for uploading files
 */
async function testStoragePermissions() {
  const results: {
    brandAssets: StorageTestResult;
    avatars: StorageTestResult;
  } = {
    brandAssets: { success: false, message: "", error: null },
    avatars: { success: false, message: "", error: null },
  };

  // Test brand-assets bucket
  try {
    // Create a tiny test file (1x1 transparent pixel)
    const base64Pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const binaryData = atob(base64Pixel);
    const array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([array], { type: "image/png" });

    // Try to upload to brand-assets
    const testPath = `test/debug-test-${Date.now()}.png`;
    const { data: brandData, error: brandError } = await serverSupabase.storage
      .from("brand-assets")
      .upload(testPath, blob);

    if (brandError) {
      results.brandAssets = {
        success: false,
        message: "Failed to upload to brand-assets",
        error: brandError,
      };
    } else {
      // Try to delete the test file
      const { error: deleteError } = await serverSupabase.storage
        .from("brand-assets")
        .remove([testPath]);

      results.brandAssets = {
        success: true,
        message: "Successfully uploaded and deleted test file",
        uploadResult: brandData,
        deleteError: deleteError ? deleteError.message : null,
        error: null,
      };
    }
  } catch (error) {
    results.brandAssets = {
      success: false,
      message: "Exception testing brand-assets bucket",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test avatars bucket
  try {
    // Create a tiny test file (1x1 transparent pixel)
    const base64Pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const binaryData = atob(base64Pixel);
    const array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([array], { type: "image/png" });

    // Try to upload to avatars
    const testPath = `test/debug-test-${Date.now()}.png`;
    const { data: avatarData, error: avatarError } =
      await serverSupabase.storage.from("avatars").upload(testPath, blob);

    if (avatarError) {
      results.avatars = {
        success: false,
        message: "Failed to upload to avatars",
        error: avatarError,
      };
    } else {
      // Try to delete the test file
      const { error: deleteError } = await serverSupabase.storage
        .from("avatars")
        .remove([testPath]);

      results.avatars = {
        success: true,
        message: "Successfully uploaded and deleted test file",
        uploadResult: avatarData,
        deleteError: deleteError ? deleteError.message : null,
        error: null,
      };
    }
  } catch (error) {
    results.avatars = {
      success: false,
      message: "Exception testing avatars bucket",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return results;
}

/**
 * Test RLS (Row Level Security) policies affecting storage
 */
async function testRLSPolicies(): Promise<RLSTestResult> {
  try {
    // Test if we can read storage.objects
    const { data: storageObjectsData, error: storageObjectsError } =
      await serverSupabase.from("storage.objects").select("*").limit(1);

    // Test if we can read storage.buckets
    const { data: storageBucketsData, error: storageBucketsError } =
      await serverSupabase.from("storage.buckets").select("*").limit(1);

    return {
      objects: {
        success: !storageObjectsError,
        data: storageObjectsData ? "Data accessible" : "No data returned",
        error: storageObjectsError ? storageObjectsError.message : null,
      },
      buckets: {
        success: !storageBucketsError,
        data: storageBucketsData ? "Data accessible" : "No data returned",
        error: storageBucketsError ? storageBucketsError.message : null,
      },
    };
  } catch (error) {
    return {
      objects: {
        success: false,
        data: "Exception occurred",
        error: error instanceof Error ? error.message : String(error),
      },
      buckets: {
        success: false,
        data: "Exception occurred",
        error: error instanceof Error ? error.message : String(error),
      },
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
