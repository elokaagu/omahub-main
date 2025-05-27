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
import { RefreshCw, Database, Image } from "lucide-react";
import setupStorage from "@/lib/supabase-storage-setup";

export default function SettingsPage() {
  const [isStorageLoading, setIsStorageLoading] = useState(false);
  const [isMigrationLoading, setIsMigrationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<Record<
    string,
    number
  > | null>(null);

  const handleStorageSetup = async () => {
    setIsStorageLoading(true);
    try {
      await setupStorage();
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

    try {
      console.log("Starting image repair request...");
      const response = await fetch("/api/repair-images", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers.entries()])
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response format");
      }

      if (!response.ok) {
        console.error("Error response from server:", data);
        throw new Error(
          data.error || `Image repair failed with status ${response.status}`
        );
      }

      setMigrationResult(data.result);
      console.log("Successfully repaired images:", data.result);
      toast.success("Image URLs repaired successfully");
    } catch (error) {
      console.error("Error during image repair:", error);
      toast.error(
        `Failed to repair image URLs: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsMigrationLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-canela text-gray-900 mb-8">
        System Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>
    </div>
  );
}
