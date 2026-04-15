"use client";

import { useState, useEffect } from "react";
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
import {
  FileText,
  HelpCircle,
  Settings,
  ArrowRight,
  Shield,
  MessageSquare,
  Lock,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useStudioPermissions } from "@/hooks/useStudioPermissions";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { permissions, loading: permissionsLoading } = useStudioPermissions(
    user?.id
  );
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<{
    isPublic: boolean;
    status: string;
    fallback?: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Check if user has super admin permissions
  const hasSettingsPermission = permissions.includes("studio.settings.manage");
  const isSuperAdmin =
    user?.role === "super_admin" || hasSettingsPermission;

  // Fetch platform status on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchPlatformStatus();
    }
  }, [isSuperAdmin]);

  if (loading || !user || permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  const fetchPlatformStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch("/api/auth/platform-status");
      const data = await response.json();

      if (response.ok && data.success) {
        setPlatformStatus({
          isPublic: data.isPublic,
          status: data.status,
          fallback:
            typeof data.fallback === "string" ? data.fallback : undefined,
        });
        setStatusError(null);
      } else {
        console.error("Failed to fetch platform status:", data.error);
        setStatusError(data?.error || "Failed to load platform visibility.");
      }
    } catch (error) {
      console.error("Error fetching platform status:", error);
      setStatusError("Could not load platform visibility. Please retry.");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleMakePublic = async () => {
    setIsChangingStatus(true);
    try {
      const response = await fetch("/api/auth/remove-password-gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          "Platform is now public! Password gate has been removed."
        );
        setPlatformStatus({ isPublic: true, status: "public" });
      } else {
        toast.error(data.error || "Failed to make platform public");
      }
    } catch (error) {
      console.error("Error making platform public:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleMakePrivate = async () => {
    setIsChangingStatus(true);
    try {
      const response = await fetch("/api/auth/enable-password-gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          "Platform is now private! Password gate has been enabled."
        );
        setPlatformStatus({ isPublic: false, status: "private" });
      } else {
        toast.error(data.error || "Failed to make platform private");
      }
    } catch (error) {
      console.error("Error making platform private:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="border-oma-beige">
          <CardHeader>
            <CardTitle className="text-oma-plum font-canela">
              Super Admin Access Required
            </CardTitle>
            <CardDescription className="text-oma-cocoa">
              Studio settings tools are limited to super admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-oma-cocoa/80">
            Contact a super admin if you need updates to legal documents, FAQs,
            or platform visibility.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-canela text-oma-plum">
            Studio Settings
          </h1>
          <p className="text-oma-cocoa mt-2">
            Manage your studio configuration and content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-oma-beige">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
                {isLoadingStatus ? (
                  <div className="animate-spin h-5 w-5 border-2 border-oma-plum border-t-transparent rounded-full" />
                ) : platformStatus?.isPublic ? (
                  <Globe className="h-5 w-5" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
                Platform Visibility
              </CardTitle>
              <CardDescription className="text-oma-cocoa">
                Control public access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStatus ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-oma-plum border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-oma-cocoa/70">Loading status...</p>
                </div>
              ) : (
                <>
                  {statusError && (
                    <p className="text-xs text-red-800 mb-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-2">
                      {statusError}
                    </p>
                  )}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        platformStatus?.isPublic
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {platformStatus?.isPublic ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Platform is Public</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Platform is Private</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-oma-cocoa/80 mb-4">
                    {platformStatus?.isPublic
                      ? "The platform is currently accessible to all visitors without a password. Anyone can browse and explore your content."
                      : "The platform is currently password-protected for internal testing. Visitors need the access password to view content."}
                  </p>

                  {platformStatus?.fallback ===
                    "missing_row_defaults_to_private" && (
                    <p className="text-xs text-oma-cocoa/75 mb-3 rounded-md bg-oma-beige/50 px-2.5 py-2">
                      No database row for platform visibility yet — effective
                      status is private until you use Make Public or Make
                      Private.
                    </p>
                  )}
                  {platformStatus?.fallback ===
                    "unrecognised_stored_value_treated_as_private" && (
                    <p className="text-xs text-amber-900/90 mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
                      Stored value is not recognised; treated as private. Use
                      the buttons below to set public or private explicitly.
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-oma-cocoa/70">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-oma-plum" />
                      <span>
                        {platformStatus?.isPublic
                          ? "Open access for all visitors"
                          : "Password-protected access"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-oma-plum" />
                      <span>
                        {platformStatus?.isPublic
                          ? "SEO friendly and discoverable"
                          : "Hidden from search engines"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {!isLoadingStatus && (
                <>
                  <Button
                    onClick={handleMakePublic}
                    disabled={
                      isChangingStatus ||
                      platformStatus?.isPublic ||
                      Boolean(statusError)
                    }
                    variant={platformStatus?.isPublic ? "secondary" : "default"}
                    className={`flex items-center gap-2 flex-1 ${
                      !platformStatus?.isPublic
                        ? "bg-oma-plum hover:bg-oma-plum/90 text-white"
                        : ""
                    }`}
                  >
                    {isChangingStatus ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Make Public</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleMakePrivate}
                    disabled={
                      isChangingStatus ||
                      !platformStatus?.isPublic ||
                      Boolean(statusError)
                    }
                    variant={!platformStatus?.isPublic ? "secondary" : "outline"}
                    className="flex items-center gap-2 flex-1"
                  >
                    {isChangingStatus ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Make Private</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

          {/* Legal Documents Management */}
          <Card className="border-oma-beige">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
                <FileText className="h-5 w-5" />
                Legal Documents
              </CardTitle>
              <CardDescription className="text-oma-cocoa">
                Manage Terms of Service and Privacy Policy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-oma-cocoa/80 mb-4">
                Create and manage your legal documents including Terms of
                Service and Privacy Policy. These documents are displayed on
                your public pages and can be versioned for compliance tracking.
              </p>
              <div className="space-y-2 text-xs text-oma-cocoa/70">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-oma-plum" />
                  <span>Version control and history</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-oma-plum" />
                  <span>Rich text editing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-oma-plum" />
                  <span>Public page integration</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
              >
                <Link href="/studio/settings/legal-documents">
                  Manage Legal Documents
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* FAQ Management */}
          <Card className="border-oma-beige">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
                <HelpCircle className="h-5 w-5" />
                FAQ Management
              </CardTitle>
              <CardDescription className="text-oma-cocoa">
                Manage frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-oma-cocoa/80 mb-4">
                Create and organise frequently asked questions that appear
                throughout your site. Organise by category and control where
                they display to provide better user support.
              </p>
              <div className="space-y-2 text-xs text-oma-cocoa/70">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-oma-plum" />
                  <span>Categorised organisation</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-oma-plum" />
                  <span>Page-specific display</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-oma-plum" />
                  <span>Rich text answers</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
              >
                <Link href="/studio/settings/faqs">
                  Manage FAQs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="border-oma-beige bg-oma-cream/30">
          <CardHeader>
            <CardTitle className="text-oma-plum font-canela">
              Content Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-oma-cocoa">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Platform Access:</strong> Control whether the
                    platform requires a password for access. Remove the password
                    gate when you're ready to launch publicly.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Legal + FAQ Controls:</strong> Use dedicated tools
                    for legal documents and FAQs to manage versions, page
                    visibility, and published content quality.
                  </p>
                </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Legal Documents:</strong> Keep your Terms of Service
                  and Privacy Policy up to date with version control and
                  effective date tracking.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                <p>
                  <strong>FAQ Management:</strong> Organise helpful information
                  for your users with categorised questions and rich text
                  answers.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Access Control:</strong> These management tools
                  require super admin privileges to ensure content security and
                  compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
