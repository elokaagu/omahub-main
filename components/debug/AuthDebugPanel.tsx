"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AuthDebugPanel() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        loading,
        hasUser: !!user,
        hasSession: !!session,
        userDetails: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              fullName:
                user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || "No name",
              avatarUrl: user.avatar_url,
              role: user.role,
            }
          : null,
        sessionDetails: session
          ? {
              userId: session.user?.id,
              email: session.user?.email,
              hasUserMetadata: !!session.user?.user_metadata,
              userMetadata: session.user?.user_metadata,
              accessTokenPreview:
                session.access_token?.substring(0, 20) + "...",
              expiresAt: session.expires_at,
            }
          : null,
        localStorage:
          typeof window !== "undefined"
            ? {
                hasAuthToken: !!localStorage.getItem("sb-auth-token"),
                authTokenLength:
                  localStorage.getItem("sb-auth-token")?.length || 0,
                oauthInProgress: sessionStorage.getItem("oauth_in_progress"),
                oauthError: sessionStorage.getItem("oauth_error"),
                oauthStartTime: sessionStorage.getItem("oauth_start_time"),
              }
            : null,
        cookies:
          typeof window !== "undefined"
            ? {
                allCookies: document.cookie,
                supabaseCookies: document.cookie
                  .split(";")
                  .filter((c) => c.includes("sb-")).length,
              }
            : null,
      };

      // Test database connection
      if (supabase && session?.user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          info.databaseProfile = {
            hasProfile: !!profile,
            profileData: profile,
            error: error?.message,
          };
        } catch (err) {
          info.databaseProfile = {
            hasProfile: false,
            error: String(err),
          };
        }
      }

      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [user, session, loading]);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-blue-700"
      >
        🐛 Auth Debug {isVisible ? "Hide" : "Show"}
      </button>

      {isVisible && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto text-xs">
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-green-600">Auth State</h3>
              <div className="bg-gray-50 p-2 rounded">
                <div>Loading: {loading ? "✅" : "❌"}</div>
                <div>Has User: {debugInfo.hasUser ? "✅" : "❌"}</div>
                <div>Has Session: {debugInfo.hasSession ? "✅" : "❌"}</div>
              </div>
            </div>

            {debugInfo.userDetails && (
              <div>
                <h3 className="font-bold text-blue-600">User Profile</h3>
                <div className="bg-blue-50 p-2 rounded">
                  <div>ID: {debugInfo.userDetails.id}</div>
                  <div>Email: {debugInfo.userDetails.email}</div>
                  <div>
                    First Name: {debugInfo.userDetails.firstName || "None"}
                  </div>
                  <div>
                    Last Name: {debugInfo.userDetails.lastName || "None"}
                  </div>
                  <div>Full Name: {debugInfo.userDetails.fullName}</div>
                  <div>
                    Avatar: {debugInfo.userDetails.avatarUrl ? "✅" : "❌"}
                  </div>
                  <div>Role: {debugInfo.userDetails.role}</div>
                </div>
              </div>
            )}

            {debugInfo.sessionDetails && (
              <div>
                <h3 className="font-bold text-purple-600">Session Data</h3>
                <div className="bg-purple-50 p-2 rounded">
                  <div>User ID: {debugInfo.sessionDetails.userId}</div>
                  <div>Email: {debugInfo.sessionDetails.email}</div>
                  <div>
                    Has Metadata:{" "}
                    {debugInfo.sessionDetails.hasUserMetadata ? "✅" : "❌"}
                  </div>
                  {debugInfo.sessionDetails.userMetadata && (
                    <div className="mt-1">
                      <div className="text-xs text-gray-600">Metadata:</div>
                      <pre className="text-xs bg-white p-1 rounded">
                        {JSON.stringify(
                          debugInfo.sessionDetails.userMetadata,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                  <div>
                    Token: {debugInfo.sessionDetails.accessTokenPreview}
                  </div>
                  <div>
                    Expires:{" "}
                    {new Date(
                      debugInfo.sessionDetails.expiresAt * 1000
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {debugInfo.databaseProfile && (
              <div>
                <h3 className="font-bold text-orange-600">Database Profile</h3>
                <div className="bg-orange-50 p-2 rounded">
                  <div>
                    Has Profile:{" "}
                    {debugInfo.databaseProfile.hasProfile ? "✅" : "❌"}
                  </div>
                  {debugInfo.databaseProfile.error && (
                    <div className="text-red-600">
                      Error: {debugInfo.databaseProfile.error}
                    </div>
                  )}
                  {debugInfo.databaseProfile.profileData && (
                    <div className="mt-1">
                      <div className="text-xs text-gray-600">Profile Data:</div>
                      <pre className="text-xs bg-white p-1 rounded max-h-20 overflow-y-auto">
                        {JSON.stringify(
                          debugInfo.databaseProfile.profileData,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {debugInfo.localStorage && (
              <div>
                <h3 className="font-bold text-red-600">Storage & OAuth</h3>
                <div className="bg-red-50 p-2 rounded">
                  <div>
                    Auth Token:{" "}
                    {debugInfo.localStorage.hasAuthToken ? "✅" : "❌"}
                  </div>
                  <div>
                    Token Length: {debugInfo.localStorage.authTokenLength}
                  </div>
                  <div>
                    OAuth Progress:{" "}
                    {debugInfo.localStorage.oauthInProgress || "None"}
                  </div>
                  <div>
                    OAuth Error: {debugInfo.localStorage.oauthError || "None"}
                  </div>
                  <div>
                    OAuth Start:{" "}
                    {debugInfo.localStorage.oauthStartTime || "None"}
                  </div>
                  <div>
                    Supabase Cookies: {debugInfo.cookies?.supabaseCookies || 0}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
