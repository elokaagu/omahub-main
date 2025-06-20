"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, User } from "lucide-react";

interface ProfileFixerProps {
  userId?: string;
}

export default function ProfileFixer({ userId }: ProfileFixerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error" | "warning";
    message: string;
    details?: any;
  }>({ type: "idle", message: "Ready to diagnose profile issues" });

  const supabase = createClientComponentClient();

  const diagnoseProfile = async () => {
    setIsLoading(true);
    setStatus({ type: "idle", message: "Diagnosing profile issues..." });

    try {
      // Get current user if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          setStatus({
            type: "error",
            message: "Not authenticated",
            details: authError,
          });
          return;
        }
        targetUserId = user.id;
      }

      // Test 1: Try different query approaches
      console.log("🔍 Testing profile queries...");

      // Approach 1: Use maybeSingle() instead of single()
      const { data: profile1, error: error1 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .maybeSingle();

      // Approach 2: Use array query first
      const { data: profiles2, error: error2 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId);

      // Approach 3: Try with specific headers
      const { data: profile3, error: error3 } = await supabase
        .from("profiles")
        .select("id, email, role, first_name, last_name")
        .eq("id", targetUserId)
        .limit(1);

      const results = {
        maybeSingle: { data: profile1, error: error1 },
        array: { data: profiles2, error: error2 },
        limited: { data: profile3, error: error3 },
      };

      // Determine best approach
      let workingProfile = null;
      let workingMethod = null;

      if (!error1 && profile1) {
        workingProfile = profile1;
        workingMethod = "maybeSingle";
      } else if (!error2 && profiles2 && profiles2.length > 0) {
        workingProfile = profiles2[0];
        workingMethod = "array";
      } else if (!error3 && profile3 && profile3.length > 0) {
        workingProfile = profile3[0];
        workingMethod = "limited";
      }

      if (workingProfile) {
        setStatus({
          type: "success",
          message: `Profile found using ${workingMethod} method`,
          details: {
            profile: workingProfile,
            methods: results,
          },
        });
      } else {
        // Profile doesn't exist - try to create it
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (user && user.id === targetUserId) {
          console.log("🔧 Creating missing profile...");
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: targetUserId,
              email: user.email,
              role: "user", // Default role
            })
            .select()
            .maybeSingle();

          if (createError) {
            setStatus({
              type: "error",
              message: "Failed to create profile",
              details: { createError, results },
            });
          } else {
            setStatus({
              type: "success",
              message: "Profile created successfully",
              details: { newProfile, results },
            });
          }
        } else {
          setStatus({
            type: "error",
            message: "Profile not found and cannot create",
            details: { results, userError },
          });
        }
      }
    } catch (error) {
      console.error("Profile diagnosis error:", error);
      setStatus({
        type: "error",
        message: "Unexpected error during diagnosis",
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixProfileAccess = async () => {
    setIsLoading(true);
    setStatus({ type: "idle", message: "Fixing profile access..." });

    try {
      // Try to fix common issues
      const fixes = [];

      // Fix 1: Clear any cached data
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
      fixes.push("Cleared cached data");

      // Fix 2: Refresh session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        fixes.push(`Session refresh failed: ${refreshError.message}`);
      } else {
        fixes.push("Session refreshed");
      }

      // Fix 3: Re-test profile access
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a moment
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId || (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError) {
        fixes.push(`Profile access still failing: ${profileError.message}`);
        setStatus({
          type: "warning",
          message: "Partial fix applied",
          details: { fixes, profileError },
        });
      } else {
        fixes.push("Profile access restored");
        setStatus({
          type: "success",
          message: "Profile access fixed",
          details: { fixes, profile },
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Error applying fixes",
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <User className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case "success":
        return "text-green-700 bg-green-50 border-green-200";
      case "error":
        return "text-red-700 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile 406 Error Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{status.message}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={diagnoseProfile}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Diagnose Profile
          </Button>

          <Button
            onClick={fixProfileAccess}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Fix Profile Access
          </Button>
        </div>

        {/* Details */}
        {status.details && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
              View Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(status.details, null, 2)}
            </pre>
          </details>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>What this fixes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>406 Not Acceptable errors when accessing profiles</li>
            <li>Missing profile records in database</li>
            <li>Stale authentication sessions</li>
            <li>Incorrect query methods causing PostgREST errors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
