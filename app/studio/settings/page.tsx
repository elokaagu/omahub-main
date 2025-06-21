"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isStorageLoading, setIsStorageLoading] = useState(false);
  const [isMigrationLoading, setIsMigrationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<Record<
    string,
    number
  > | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStorageSetup = async () => {
    setIsStorageLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/setup-storage", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Storage setup failed");
      }

      const data = await response.json();
      toast.success("Storage buckets configured successfully");
      console.log("Storage setup result:", data);
    } catch (error) {
      console.error("Error setting up storage:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(errorMsg);
      toast.error(`Failed to set up storage: ${errorMsg}`);
    } finally {
      setIsStorageLoading(false);
    }
  };

  const handleImageMigration = async () => {
    setIsMigrationLoading(true);
    setMigrationResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/repair-images", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image repair failed");
      }

      const data = await response.json();
      setMigrationResult(data.result);
      toast.success(data.message || "Image URLs repaired successfully");
    } catch (error) {
      console.error("Error during image repair:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(errorMsg);
      toast.error(`Failed to repair image URLs: ${errorMsg}`);
    } finally {
      setIsMigrationLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-oma-plum/50" />
          <h3 className="mt-4 text-lg font-canela text-oma-plum">
            Authentication Required
          </h3>
          <p className="mt-2 text-oma-cocoa">
            Please sign in to access studio settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-canela text-oma-plum">Studio Settings</h1>
        <p className="text-oma-cocoa mt-2">
          Manage your studio configuration and maintenance tools
        </p>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Setup */}
        <Card className="border-oma-beige">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
              <Database className="h-5 w-5" />
              Storage Configuration
            </CardTitle>
            <CardDescription className="text-oma-cocoa">
              Configure Supabase storage buckets for file uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-oma-cocoa/80 mb-4">
              This will create and configure all necessary storage buckets with
              proper permissions for brand images, product photos, and user
              avatars.
            </p>
            <div className="space-y-2 text-xs text-oma-cocoa/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Brand assets bucket</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Product images bucket</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>User avatars bucket</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Hero images bucket</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStorageSetup}
              disabled={isStorageLoading}
              className="bg-oma-plum hover:bg-oma-plum/90 text-white flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isStorageLoading ? "animate-spin" : ""}`}
              />
              {isStorageLoading ? "Configuring..." : "Configure Storage"}
            </Button>
          </CardFooter>
        </Card>

        {/* Image URL Repair */}
        <Card className="border-oma-beige">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
              <Image className="h-5 w-5" />
              Image URL Repair
            </CardTitle>
            <CardDescription className="text-oma-cocoa">
              Fix and update image URLs in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-oma-cocoa/80 mb-4">
              This utility will scan and repair any incorrectly formatted image
              URLs in your database, ensuring all images display properly.
            </p>

            {migrationResult && (
              <div className="mt-4 p-4 bg-oma-cream rounded-lg border border-oma-beige">
                <h3 className="font-medium text-oma-plum text-sm mb-2">
                  Repair Results:
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-oma-cocoa">
                  <div>Brands: {migrationResult.brands}</div>
                  <div>Collections: {migrationResult.collections}</div>
                  <div>Products: {migrationResult.products}</div>
                  <div>Profiles: {migrationResult.profiles}</div>
                </div>
                <div className="font-medium pt-2 border-t border-oma-beige mt-2 text-oma-plum">
                  Total Fixed: {migrationResult.total}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleImageMigration}
              disabled={isMigrationLoading}
              className="bg-oma-plum hover:bg-oma-plum/90 text-white flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isMigrationLoading ? "animate-spin" : ""
                }`}
              />
              {isMigrationLoading ? "Repairing..." : "Repair Image URLs"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Additional Information */}
      <Card className="border-oma-beige bg-oma-cream/30">
        <CardHeader>
          <CardTitle className="text-oma-plum font-canela">
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-oma-cocoa">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Storage Configuration:</strong> Only needs to be run
                once or when adding new storage buckets. Safe to run multiple
                times.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Image URL Repair:</strong> Can be run periodically to
                ensure all images are properly formatted and accessible.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Permissions:</strong> These tools require admin
                privileges and may take a few moments to complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
