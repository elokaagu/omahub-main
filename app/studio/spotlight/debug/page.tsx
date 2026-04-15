"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type DiagnosticsInfo = {
  timestamp: string;
  contextUser: {
    id?: string;
    email?: string;
    role?: string;
  } | null;
  session: {
    hasSession: boolean;
    userId?: string;
    email?: string;
    error?: string;
  } | null;
  directUser: {
    hasUser: boolean;
    userId?: string;
    email?: string;
    error?: string;
  } | null;
  profile: {
    role?: string;
    email?: string;
    error?: string;
  } | null;
  uploadTest: {
    attempted: boolean;
    success: boolean;
    path?: string;
    error?: string;
  } | null;
  error?: string;
};

export default function SpotlightDebugPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<DiagnosticsInfo | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "super_admin") {
      router.push("/studio");
    }
  }, [authLoading, user, router]);

  const summary = useMemo(() => {
    if (!debugInfo) return null;
    const authPass = Boolean(
      debugInfo.contextUser &&
        debugInfo.directUser?.hasUser &&
        debugInfo.session?.hasSession
    );
    const profilePass = Boolean(
      debugInfo.profile && !debugInfo.profile.error && debugInfo.profile.role
    );
    const uploadPass = Boolean(
      debugInfo.uploadTest &&
        debugInfo.uploadTest.attempted &&
        debugInfo.uploadTest.success
    );
    return { authPass, profilePass, uploadPass };
  }, [debugInfo]);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const info: DiagnosticsInfo = {
      timestamp: new Date().toISOString(),
      contextUser: null,
      session: null,
      directUser: null,
      profile: null,
      uploadTest: null,
    };

    try {
      // Check user from context
      info.contextUser = user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        : null;

      // Check session directly from Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      info.session = {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message,
      };

      // Check user directly from Supabase
      const {
        data: { user: directUser },
        error: userError,
      } = await supabase.auth.getUser();
      info.directUser = {
        hasUser: !!directUser,
        userId: directUser?.id,
        email: directUser?.email,
        error: userError?.message,
      };

      // Check profile from database
      if (directUser) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", directUser.id)
          .single();

        info.profile = {
          role: profile?.role,
          email: profile?.email,
          error: profileError?.message,
        };
      }

      // Test upload to spotlight-images
      const testFile = new Blob(["test content"], { type: "image/jpeg" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("spotlight-images")
        .upload(`debug-test-${Date.now()}.jpg`, testFile);

      info.uploadTest = {
        attempted: true,
        success: Boolean(uploadData),
        path: uploadData?.path,
        error: uploadError?.message,
      };

      // Clean up test file if successful
      if (uploadData) {
        await supabase.storage
          .from("spotlight-images")
          .remove([uploadData.path]);
      }
    } catch (error) {
      info.error = error instanceof Error ? error.message : "Unknown error";
    }

    setDebugInfo(info);
    setIsRunningDiagnostics(false);
  };

  const refreshSession = async () => {
    setIsRefreshingSession(true);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        toast.error(`Session refresh failed: ${error.message}`);
      } else {
        toast.success("Session refreshed successfully");
        // Trigger a re-run of diagnostics
        await runDiagnostics();
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
    setIsRefreshingSession(false);
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-oma-cocoa">Loading...</div>
    );
  }

  if (user.role !== "super_admin") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-oma-cocoa">
            This diagnostics page is restricted to super admin users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/studio/spotlight">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Spotlight
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Spotlight Upload Debug
          </h1>
          <p className="text-oma-cocoa">
            Diagnose authentication and upload issues
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDiagnostics} disabled={isRunningDiagnostics || isRefreshingSession}>
              {isRunningDiagnostics ? "Running..." : "Run Diagnostics"}
            </Button>
            <Button
              onClick={refreshSession}
              disabled={isRunningDiagnostics || isRefreshingSession}
              variant="outline"
            >
              {isRefreshingSession ? "Refreshing..." : "Refresh Session"}
            </Button>
            <p className="text-xs text-oma-cocoa/70">
              The upload check performs a temporary write to `spotlight-images` and deletes it immediately.
            </p>
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Health Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Auth:{" "}
                <span className={summary.authPass ? "text-green-700" : "text-red-700"}>
                  {summary.authPass ? "PASS" : "FAIL"}
                </span>
              </p>
              <p>
                Profile:{" "}
                <span className={summary.profilePass ? "text-green-700" : "text-red-700"}>
                  {summary.profilePass ? "PASS" : "FAIL"}
                </span>
              </p>
              <p>
                Storage Upload:{" "}
                <span className={summary.uploadPass ? "text-green-700" : "text-red-700"}>
                  {summary.uploadPass ? "PASS" : "FAIL"}
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p>
                <strong>Expected Results:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>User role should be `super_admin`</li>
                <li>Session should exist and be valid</li>
                <li>Upload test should succeed</li>
              </ul>
            </div>
            <div className="text-sm space-y-2">
              <p>
                <strong>If upload fails:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Try clicking "Refresh Session"</li>
                <li>Sign out and sign back in</li>
                <li>Clear browser cache and cookies</li>
                <li>Check browser console for errors</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
