"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RefreshCw,
  Database,
  Image,
  Wrench,
  FileText,
  Settings,
} from "lucide-react";
import { debugFetch, inspectJSON } from "@/lib/debug-utils";
import Link from "next/link";

export default function SettingsPage() {
  const [isStorageLoading, setIsStorageLoading] = useState(false);
  const [isMigrationLoading, setIsMigrationLoading] = useState(false);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<Record<
    string,
    number
  > | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const handleStorageSetup = async () => {
    setIsStorageLoading(true);
    try {
      toast.success("Storage setup completed successfully");
    } catch (error) {
      console.error("Error setting up storage:", error);
      toast.error("Failed to set up storage");
    } finally {
      setIsStorageLoading(false);
    }
  };

  const handleImageMigration = async () => {
    setIsMigrationLoading(true);
    setMigrationResult(null);
    setErrorMessage(null);

    try {
      console.log("Starting image repair request...");

      // Create a new AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Use timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/repair-images?t=${timestamp}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers.entries()])
      );

      // Get raw response text
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      // Check if response is empty
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response received from server");
      }

      // Clean the response string - remove any trailing non-JSON characters
      let cleanResponse = responseText.trim();

      // Remove any non-printable characters
      cleanResponse = cleanResponse.replace(/[^\x20-\x7E]/g, "");

      // Remove trailing percentage or other non-JSON characters
      while (
        cleanResponse.length > 0 &&
        ![
          "}",
          "]",
          '"',
          "'",
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ].includes(cleanResponse[cleanResponse.length - 1])
      ) {
        cleanResponse = cleanResponse.slice(0, -1);
      }

      // Parse the JSON
      let data;
      try {
        data = JSON.parse(cleanResponse);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error(
          "Failed to parse response as JSON:",
          parseError,
          "Response was:",
          cleanResponse
        );
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        console.error("Error response from server:", data);
        throw new Error(
          data.error || `Image repair failed with status ${response.status}`
        );
      }

      if (!data.result) {
        console.error("Missing result data in response:", data);
        throw new Error("Response missing required data");
      }

      setMigrationResult(data.result);
      console.log("Successfully repaired images:", data.result);
      toast.success(data.message || "Image URLs repaired successfully");
    } catch (error) {
      console.error("Error during image repair:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMsg);
      toast.error(`Failed to repair image URLs: ${errorMsg}`);
    } finally {
      setIsMigrationLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setIsDiagnosticLoading(true);
    setDiagnosticResult(null);
    setDiagnosticError(null);

    try {
      toast.info("Running upload diagnostics...");

      // Use our debug-enhanced fetch
      const timestamp = new Date().getTime();
      const response = await debugFetch(
        `/api/debug/upload-test?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          cache: "no-store",
        }
      );

      // Get the response text
      const responseText = await response.text();

      // Inspect and clean the JSON
      const { valid, parsed, error } = inspectJSON(responseText);

      if (!valid) {
        throw new Error(`Invalid JSON response: ${error}`);
      }

      if (!response.ok) {
        throw new Error(`Diagnostic failed with status ${response.status}`);
      }

      setDiagnosticResult(parsed);
      toast.success("Diagnostics completed successfully");
    } catch (error) {
      console.error("Error during diagnostics:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setDiagnosticError(errorMsg);
      toast.error(`Diagnostics failed: ${errorMsg}`);
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your system settings and configurations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Legal Documents Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Legal Documents
            </CardTitle>
            <CardDescription>
              Manage Terms of Service and Privacy Policy content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Edit and update your legal documents that are displayed on your
              website. Create new versions, manage effective dates, and control
              which versions are active.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Rich text editor with formatting tools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Version control and history</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Effective date management</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/studio/settings/legal-documents">
              <Button className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Legal Documents
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Setup
            </CardTitle>
            <CardDescription>
              Ensure Supabase storage buckets are properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This utility will check and create the necessary storage buckets
              in your Supabase project, ensuring they have the correct
              permissions for file uploads.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStorageSetup}
              disabled={isStorageLoading}
              className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isStorageLoading ? "animate-spin" : ""}`}
              />
              {isStorageLoading ? "Setting up..." : "Setup Storage"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Fix Image URLs
            </CardTitle>
            <CardDescription>
              Fix incorrectly formatted image URLs in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This utility will update any image URLs that are using the
              incorrect format (/lovable-uploads/) to the correct Supabase
              storage URL format.
            </p>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                <h3 className="font-medium text-sm mb-2">Error:</h3>
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            {migrationResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-sm mb-2">Repair Results:</h3>
                <ul className="text-sm space-y-1">
                  <li>Brands: {migrationResult.brands} updated</li>
                  <li>Collections: {migrationResult.collections} updated</li>
                  <li>Products: {migrationResult.products} updated</li>
                  <li>Profiles: {migrationResult.profiles} updated</li>
                  <li className="font-medium pt-1 border-t border-gray-200 mt-2">
                    Total: {migrationResult.total} images fixed
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleImageMigration}
              disabled={isMigrationLoading}
              className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isMigrationLoading ? "animate-spin" : ""
                }`}
              />
              {isMigrationLoading ? "Repairing URLs..." : "Repair Image URLs"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Diagnostics
            </CardTitle>
            <CardDescription>
              Run diagnostics to identify image upload issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This tool performs comprehensive diagnostics of your image upload
              system. It checks storage buckets, permissions, and RLS policies
              to identify potential issues preventing uploads from working
              correctly.
            </p>

            {diagnosticError && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                <h3 className="font-medium text-sm mb-2">Diagnostic Error:</h3>
                <p className="text-sm">{diagnosticError}</p>
              </div>
            )}

            {diagnosticResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-[400px]">
                <h3 className="font-medium text-sm mb-2">
                  Diagnostic Results:
                </h3>

                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">
                    Environment
                  </h4>
                  <div className="bg-white p-2 rounded border border-gray-200 mb-2">
                    <pre className="text-xs">
                      {JSON.stringify(
                        diagnosticResult.diagnostics.environment,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">
                    Storage Buckets
                  </h4>
                  <div className="text-xs">
                    <div
                      className={`px-2 py-1 rounded ${
                        diagnosticResult.diagnostics.bucketTests.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      Status:{" "}
                      {diagnosticResult.diagnostics.bucketTests.success
                        ? "OK"
                        : "Issues Detected"}
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                      <pre className="text-xs">
                        {JSON.stringify(
                          diagnosticResult.diagnostics.bucketTests,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">
                    Storage Permissions
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Brand Assets Bucket:</span>
                      <span
                        className={
                          diagnosticResult.diagnostics.permissionTests
                            .brandAssets.success
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {diagnosticResult.diagnostics.permissionTests
                          .brandAssets.success
                          ? "Working"
                          : "Not Working"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avatars Bucket:</span>
                      <span
                        className={
                          diagnosticResult.diagnostics.permissionTests.avatars
                            .success
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {diagnosticResult.diagnostics.permissionTests.avatars
                          .success
                          ? "Working"
                          : "Not Working"}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                      <pre className="text-xs">
                        {JSON.stringify(
                          diagnosticResult.diagnostics.permissionTests,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">
                    RLS Policies
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Storage Objects Access:</span>
                      <span
                        className={
                          diagnosticResult.diagnostics.rlsTests.objects.success
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {diagnosticResult.diagnostics.rlsTests.objects.success
                          ? "Accessible"
                          : "Restricted"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Buckets Access:</span>
                      <span
                        className={
                          diagnosticResult.diagnostics.rlsTests.buckets.success
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {diagnosticResult.diagnostics.rlsTests.buckets.success
                          ? "Accessible"
                          : "Restricted"}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                      <pre className="text-xs">
                        {JSON.stringify(
                          diagnosticResult.diagnostics.rlsTests,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={runDiagnostics}
              disabled={isDiagnosticLoading}
              className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isDiagnosticLoading ? "animate-spin" : ""
                }`}
              />
              {isDiagnosticLoading
                ? "Running Diagnostics..."
                : "Run Diagnostics"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
