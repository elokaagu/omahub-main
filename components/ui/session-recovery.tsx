"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SessionRecoveryProps {
  onRecoverySuccess?: () => void;
  onRecoveryFailure?: () => void;
}

export function SessionRecovery({ onRecoverySuccess, onRecoveryFailure }: SessionRecoveryProps) {
  const { attemptSessionRecovery, loading } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "recovering" | "success" | "failed">("idle");

  const handleRecovery = async () => {
    try {
      setIsRecovering(true);
      setRecoveryStatus("recovering");

      const success = await attemptSessionRecovery();

      if (success) {
        setRecoveryStatus("success");
        toast.success("Session recovered successfully!");
        onRecoverySuccess?.();
      } else {
        setRecoveryStatus("failed");
        toast.error("Session recovery failed. Please sign in again.");
        onRecoveryFailure?.();
      }
    } catch (error) {
      console.error("Session recovery error:", error);
      setRecoveryStatus("failed");
      toast.error("Session recovery failed. Please sign in again.");
      onRecoveryFailure?.();
    } finally {
      setIsRecovering(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Session Recovery
        </CardTitle>
        <CardDescription>
          It looks like your session was lost. Try to recover it before signing in again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This can happen when:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>You refreshed the page</li>
            <li>Your browser cleared local storage</li>
            <li>You switched between tabs</li>
            <li>Your session token expired</li>
          </ul>
        </div>

        <Button
          onClick={handleRecovery}
          disabled={isRecovering}
          className="w-full"
          variant={recoveryStatus === "success" ? "default" : "outline"}
        >
          {recoveryStatus === "recovering" ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recovering Session...
            </>
          ) : recoveryStatus === "success" ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Session Recovered!
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recover Session
            </>
          )}
        </Button>

        {recoveryStatus === "failed" && (
          <div className="text-sm text-destructive text-center">
            Recovery failed. You may need to sign in again.
          </div>
        )}

        {recoveryStatus === "success" && (
          <div className="text-sm text-green-600 text-center">
            Your session has been restored successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
