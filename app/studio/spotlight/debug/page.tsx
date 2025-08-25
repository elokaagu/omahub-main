"use client";



import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SpotlightDebugPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      user: null,
      session: null,
      profile: null,
      uploadTest: null,
    };

    try {
      // Check user from context
      info.user = user
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
          data: profile,
          error: profileError?.message,
        };
      }

      // Test upload to spotlight-images
      const testFile = new Blob(["test content"], { type: "image/jpeg" });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("spotlight-images")
        .upload(`debug-test-${Date.now()}.jpg`, testFile);

      info.uploadTest = {
        success: !!uploadData,
        data: uploadData,
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
    setLoading(false);
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        alert(`Session refresh failed: ${error.message}`);
      } else {
        alert("Session refreshed successfully!");
        // Trigger a re-run of diagnostics
        await runDiagnostics();
      }
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
    setLoading(false);
  };

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
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? "Running..." : "Run Diagnostics"}
            </Button>
            <Button
              onClick={refreshSession}
              disabled={loading}
              variant="outline"
            >
              {loading ? "Refreshing..." : "Refresh Session"}
            </Button>
          </CardContent>
        </Card>

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
                <li>User should have email: eloka.agu@icloud.com</li>
                <li>User role should be: super_admin</li>
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
