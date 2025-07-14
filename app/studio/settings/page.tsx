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
  Clipboard,
  Edit3,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const { user, refreshUserProfile, loading } = useAuth();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<{
    isPublic: boolean;
    status: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [aboutText, setAboutText] = useState("");
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [ourStoryText, setOurStoryText] = useState("");
  const [ourStoryLoading, setOurStoryLoading] = useState(false);
  const [ourStorySaving, setOurStorySaving] = useState(false);
  const [refreshingHomepageBrands, setRefreshingHomepageBrands] =
    useState(false);

  // Inline editing states
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingOurStory, setIsEditingOurStory] = useState(false);
  const [tempAboutText, setTempAboutText] = useState("");
  const [tempOurStoryText, setTempOurStoryText] = useState("");

  // Check if user has super admin permissions
  const isSuperAdmin = user?.role === "super_admin";

  // Fetch platform status on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchPlatformStatus();
    }
  }, [isSuperAdmin]);

  // Fetch About Us and Our Story text on mount (super admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      setAboutLoading(true);
      setOurStoryLoading(true);
      fetch("/api/platform-settings")
        .then((res) => res.json())
        .then((data) => {
          setAboutText(data.about || "");
          setOurStoryText(data.ourStory || "");
        })
        .catch(() => toast.error("Failed to load About Us/Our Story text"))
        .finally(() => {
          setAboutLoading(false);
          setOurStoryLoading(false);
        });
    }
  }, [isSuperAdmin]);

  // Ensure user is always up to date
  useEffect(() => {
    if (!user && !loading) {
      refreshUserProfile();
    }
  }, [user, loading, refreshUserProfile]);

  useEffect(() => {
    console.log("Current user in settings page:", user);
  }, [user]);

  if (loading || !user) {
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
        });
      } else {
        console.error("Failed to fetch platform status:", data.error);
      }
    } catch (error) {
      console.error("Error fetching platform status:", error);
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

  // Inline editing handlers for About Us
  const handleEditAbout = () => {
    setTempAboutText(aboutText);
    setIsEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    setAboutSaving(true);
    try {
      const res = await fetch("/api/platform-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: tempAboutText, user }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAboutText(tempAboutText);
        setIsEditingAbout(false);
        toast.success("About Us updated successfully");
      } else {
        toast.error(data.error || "Failed to update About Us");
      }
    } catch {
      toast.error("Failed to update About Us");
    } finally {
      setAboutSaving(false);
    }
  };

  const handleCancelAbout = () => {
    setIsEditingAbout(false);
    setTempAboutText("");
  };

  // Inline editing handlers for Our Story
  const handleEditOurStory = () => {
    setTempOurStoryText(ourStoryText);
    setIsEditingOurStory(true);
  };

  const handleSaveOurStory = async () => {
    setOurStorySaving(true);
    try {
      const res = await fetch("/api/platform-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ourStory: tempOurStoryText, user }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOurStoryText(tempOurStoryText);
        setIsEditingOurStory(false);
        toast.success("Our Story updated successfully");
      } else {
        toast.error(data.error || "Failed to update Our Story");
      }
    } catch {
      toast.error("Failed to update Our Story");
    } finally {
      setOurStorySaving(false);
    }
  };

  const handleCancelOurStory = () => {
    setIsEditingOurStory(false);
    setTempOurStoryText("");
  };

  // Super admin: Refresh homepage brands
  const handleRefreshHomepageBrands = async () => {
    setRefreshingHomepageBrands(true);
    try {
      const res = await fetch("/api/admin/refresh-homepage-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Homepage brands refreshed successfully");
      } else {
        toast.error(data.error || "Failed to refresh homepage brands");
      }
    } catch {
      toast.error("Failed to refresh homepage brands");
    } finally {
      setRefreshingHomepageBrands(false);
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-canela text-oma-plum">
            Studio Settings
          </h1>
          <p className="text-oma-cocoa mt-2">
            Manage your studio configuration and content
          </p>
          {/* Super admin only: Refresh homepage brands button */}
          {/* Removed Refresh Homepage Brands button and description */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Removed About Us and Our Story cards */}
          {/* Platform Access Control - Only for Super Admins */}
          {isSuperAdmin && (
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
                    <p className="text-sm text-oma-cocoa/70">
                      Loading status...
                    </p>
                  </div>
                ) : (
                  <>
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
                      disabled={isChangingStatus || platformStatus?.isPublic}
                      variant={
                        platformStatus?.isPublic ? "secondary" : "default"
                      }
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
                      disabled={isChangingStatus || !platformStatus?.isPublic}
                      variant={
                        !platformStatus?.isPublic ? "secondary" : "outline"
                      }
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
          )}

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
              {isSuperAdmin && (
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Platform Access:</strong> Control whether the
                    platform requires a password for access. Remove the password
                    gate when you're ready to launch publicly.
                  </p>
                </div>
              )}
              {isSuperAdmin && (
                <div className="flex items-start gap-2">
                  <Edit3 className="h-4 w-4 text-oma-plum mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Content Editing:</strong> Edit About Us and Our
                    Story content directly in the studio without needing to
                    navigate to separate pages. Changes are saved immediately
                    and reflected on the public About page.
                  </p>
                </div>
              )}
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
