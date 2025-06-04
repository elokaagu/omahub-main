"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AuthDiagnostic() {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const supabase = createClientComponentClient();

  const runDiagnostic = async () => {
    setIsChecking(true);
    try {
      // Get current session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      // Try a simple database query
      const { data: testQuery, error: queryError } = await supabase
        .from("brands")
        .select("id, name")
        .limit(1);

      const info = {
        timestamp: new Date().toISOString(),
        session: {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          email: sessionData.session?.user?.email,
          expiresAt: sessionData.session?.expires_at,
          error: sessionError?.message,
        },
        user: {
          hasUser: !!userData.user,
          userId: userData.user?.id,
          email: userData.user?.email,
          error: userError?.message,
        },
        databaseTest: {
          success: !queryError,
          error: queryError?.message,
          resultCount: testQuery?.length || 0,
        },
      };

      setDiagnosticInfo(info);

      if (sessionError || userError || queryError) {
        toast.error(
          "Authentication issues detected. Check the diagnostic info below."
        );
      } else {
        toast.success("Authentication is working correctly!");
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast.error("Failed to run diagnostic");
    } finally {
      setIsChecking(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        toast.error("Failed to refresh session");
      } else {
        toast.success("Session refreshed successfully");
        // Re-run diagnostic
        runDiagnostic();
      }
    } catch (error) {
      toast.error("Failed to refresh session");
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-800 mb-3">
        🔧 Authentication Diagnostic
      </h3>

      <div className="flex space-x-2 mb-4">
        <Button
          onClick={runDiagnostic}
          disabled={isChecking}
          variant="outline"
          size="sm"
        >
          {isChecking ? "Checking..." : "Run Diagnostic"}
        </Button>
        <Button onClick={refreshAuth} variant="outline" size="sm">
          Refresh Session
        </Button>
      </div>

      {diagnosticInfo && (
        <div className="bg-white rounded p-3 text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-64">
            {JSON.stringify(diagnosticInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
