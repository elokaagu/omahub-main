"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function EnvChecker() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
    canCreateClient: boolean;
    clientError?: string;
  } | null>(null);

  const checkEnvironment = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let canCreateClient = false;
    let clientError = "";

    try {
      // Try to create a Supabase client
      if (supabaseUrl && supabaseKey) {
        // Dynamic import to avoid build issues
        import("@supabase/supabase-js").then(({ createClient }) => {
          try {
            const client = createClient(supabaseUrl, supabaseKey);
            canCreateClient = true;
            setEnvStatus({
              supabaseUrl: !!supabaseUrl,
              supabaseKey: !!supabaseKey,
              canCreateClient: true,
            });
          } catch (error) {
            setEnvStatus({
              supabaseUrl: !!supabaseUrl,
              supabaseKey: !!supabaseKey,
              canCreateClient: false,
              clientError:
                error instanceof Error ? error.message : "Unknown error",
            });
          }
        });
      } else {
        setEnvStatus({
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          canCreateClient: false,
          clientError: "Missing environment variables",
        });
      }
    } catch (error) {
      setEnvStatus({
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        canCreateClient: false,
        clientError: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  const getIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Environment Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {envStatus ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Supabase URL:</span>
              {getIcon(envStatus.supabaseUrl)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Supabase Key:</span>
              {getIcon(envStatus.supabaseKey)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Client Creation:</span>
              {getIcon(envStatus.canCreateClient)}
            </div>

            {envStatus.clientError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Error:</strong> {envStatus.clientError}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Button
                onClick={checkEnvironment}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Recheck Environment
              </Button>
              <Button onClick={refreshPage} size="sm" className="w-full">
                Refresh Page
              </Button>
            </div>

            {!envStatus.supabaseUrl || !envStatus.supabaseKey ? (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <strong>Fix:</strong> Environment variables are missing. Make
                sure you have a .env.local file with NEXT_PUBLIC_SUPABASE_URL
                and NEXT_PUBLIC_SUPABASE_ANON_KEY, or restart the development
                server.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Checking environment...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
