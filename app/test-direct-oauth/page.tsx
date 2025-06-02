"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestDirectOAuth() {
  const [oauthUrl, setOauthUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const generateOAuthUrl = async () => {
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data?.url) {
        setOauthUrl(data.url);
        console.log("Generated OAuth URL:", data.url);
      } else {
        throw new Error("No OAuth URL generated");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("OAuth URL generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testManualRedirect = () => {
    if (oauthUrl) {
      console.log("Manually redirecting to:", oauthUrl);
      window.location.href = oauthUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Direct OAuth Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              OAuth URL Generation Test
            </h2>
            <p className="text-gray-600 mb-4">
              This will generate the OAuth URL without automatically
              redirecting.
            </p>

            <button
              onClick={generateOAuthUrl}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate OAuth URL"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {oauthUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                OAuth URL Generated:
              </h3>
              <div className="bg-white border rounded p-3 mb-4">
                <code className="text-sm break-all">{oauthUrl}</code>
              </div>

              <div className="space-y-2">
                <button
                  onClick={testManualRedirect}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mr-2"
                >
                  Test Manual Redirect
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(oauthUrl)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Current Environment:
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>
                <strong>Origin:</strong>{" "}
                {typeof window !== "undefined" ? window.location.origin : "N/A"}
              </li>
              <li>
                <strong>Callback URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? `${window.location.origin}/auth/callback`
                  : "N/A"}
              </li>
              <li>
                <strong>Supabase Available:</strong>{" "}
                {supabase ? "✅ Yes" : "❌ No"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
