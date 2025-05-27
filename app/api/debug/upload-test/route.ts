import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import setupStorage from "@/lib/supabase-storage-setup";

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
    // 1. Gather environment info
    const environmentInfo = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured",
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      vercelEnv: process.env.VERCEL_ENV || "Not on Vercel",
    };

    // 2. Test storage buckets
    console.log("Testing storage buckets...");
    const bucketTests = await testStorageBuckets();

    // 3. Test storage permissions
    console.log("Testing storage permissions...");
    const permissionTests = await testStoragePermissions();

    // 4. Test RLS policies
    console.log("Testing RLS policies...");
    const rlsTests = await testRLSPolicies();

    // Compile all diagnostic results
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      environment: environmentInfo,
      bucketTests,
      permissionTests,
      rlsTests,
    };

    // Return a simple Response object with all diagnostics
    return new Response(
      JSON.stringify({
        success: true,
        message: "Upload diagnostics completed",
        diagnostics: diagnosticResults,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error running upload diagnostics:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Upload diagnostics failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
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
      await supabase.storage.listBuckets();

    if (bucketsError) {
      return {
        success: false,
        error: bucketsError.message,
        details: bucketsError,
      };
    }

    // Try to run storage setup
    let setupResult: StorageSetupResult = {
      success: true,
      message: "Storage setup completed",
    };
    try {
      await setupStorage();
    } catch (setupError) {
      setupResult = {
        success: false,
        error:
          setupError instanceof Error ? setupError.message : String(setupError),
      };
    }

    // List buckets again after setup
    const { data: updatedBucketsData, error: updatedBucketsError } =
      await supabase.storage.listBuckets();

    return {
      success: !bucketsError && !updatedBucketsError,
      initialBuckets: bucketsData || [],
      setupResult,
      bucketsAfterSetup: updatedBucketsData || [],
      bucketsError: bucketsError ? bucketsError.message : null,
      updatedBucketsError: updatedBucketsError
        ? updatedBucketsError.message
        : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
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
    const { data: brandData, error: brandError } = await supabase.storage
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
      const { error: deleteError } = await supabase.storage
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
    const { data: avatarData, error: avatarError } = await supabase.storage
      .from("avatars")
      .upload(testPath, blob);

    if (avatarError) {
      results.avatars = {
        success: false,
        message: "Failed to upload to avatars",
        error: avatarError,
      };
    } else {
      // Try to delete the test file
      const { error: deleteError } = await supabase.storage
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
      await supabase.from("storage.objects").select("*").limit(1);

    // Test if we can read storage.buckets
    const { data: storageBucketsData, error: storageBucketsError } =
      await supabase.from("storage.buckets").select("*").limit(1);

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
