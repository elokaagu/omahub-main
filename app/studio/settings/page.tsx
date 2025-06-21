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
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();

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
                Create and organize frequently asked questions that appear
                throughout your site. Organize by category and control where
                they display to provide better user support.
              </p>
              <div className="space-y-2 text-xs text-oma-cocoa/70">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-oma-plum" />
                  <span>Categorized organization</span>
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
                  <strong>FAQ Management:</strong> Organize helpful information
                  for your users with categorized questions and rich text
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
