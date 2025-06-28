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
import {
  FileText,
  HelpCircle,
  Settings,
  ArrowRight,
  Shield,
  MessageSquare,
  Lock,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isRemovingPasswordGate, setIsRemovingPasswordGate] = useState(false);

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

  // Check if user has super admin permissions
  const isSuperAdmin = user.role === "super_admin";

  const handleRemovePasswordGate = async () => {
    setIsRemovingPasswordGate(true);
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
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to remove password gate");
      }
    } catch (error) {
      console.error("Error removing password gate:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRemovingPasswordGate(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Access Control - Only for Super Admins */}
          {isSuperAdmin && (
            <Card className="border-oma-beige">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
                  <Lock className="h-5 w-5" />
                  Platform Access
                </CardTitle>
                <CardDescription className="text-oma-cocoa">
                  Control public access to the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-oma-cocoa/80 mb-4">
                  The platform is currently password-protected for internal
                  testing. When you're ready to go public, you can remove the
                  password gate to allow unrestricted access.
                </p>
                <div className="space-y-2 text-xs text-oma-cocoa/70">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-oma-plum" />
                    <span>Currently password-protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-oma-plum" />
                    <span>Make public when ready</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleRemovePasswordGate}
                  disabled={isRemovingPasswordGate}
                  className="bg-oma-plum hover:bg-oma-plum/90 text-white flex items-center gap-2 w-full"
                >
                  {isRemovingPasswordGate ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Making Public...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Make Platform Public</span>
                    </>
                  )}
                </Button>
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
              {isSuperAdmin ? (
                <Link
                  href="/studio/settings/legal-documents"
                  className="w-full"
                >
                  <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white flex items-center gap-2 w-full">
                    <span>Manage Legal Documents</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="text-center w-full">
                  <p className="text-sm text-oma-cocoa/60 mb-3">
                    Super admin access required
                  </p>
                  <Button disabled className="w-full">
                    <span>Manage Legal Documents</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
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
              {isSuperAdmin ? (
                <Link href="/studio/settings/faqs" className="w-full">
                  <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white flex items-center gap-2 w-full">
                    <span>Manage FAQs</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div className="text-center w-full">
                  <p className="text-sm text-oma-cocoa/60 mb-3">
                    Super admin access required
                  </p>
                  <Button disabled className="w-full">
                    <span>Manage FAQs</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Information Card */}
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
