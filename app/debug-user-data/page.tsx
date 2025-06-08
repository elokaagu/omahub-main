"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getProfile } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";

export default function DebugUserDataPage() {
  const { user, session } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const profile = await getProfile(user.id);
      setProfileData(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const displayName =
    user?.first_name || user?.last_name
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : session?.user?.user_metadata?.full_name
        ? session.user.user_metadata.full_name
        : session?.user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-canela text-oma-plum mb-8">
          User Data Debug
        </h1>

        <div className="space-y-6">
          {/* Current Display Name */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Display Name</h2>
            <div className="text-lg font-medium text-green-600">
              "{displayName}"
            </div>
          </div>

          {/* Auth Context User Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Auth Context User Data
            </h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Session Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Session Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          {/* Profile Data from Database */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Profile Data from Database
              <Button
                onClick={fetchProfile}
                disabled={loading}
                className="ml-4 text-sm"
                variant="outline"
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>

          {/* Display Name Logic Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Display Name Logic</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Condition 1:</strong> user?.first_name ||
                user?.last_name
                <br />
                <span className="ml-4">
                  first_name: "{user?.first_name || "null"}"
                  {user?.first_name ? " ✅" : " ❌"}
                </span>
                <br />
                <span className="ml-4">
                  last_name: "{user?.last_name || "null"}"
                  {user?.last_name ? " ✅" : " ❌"}
                </span>
                <br />
                <span className="ml-4">
                  Either present:{" "}
                  {user?.first_name || user?.last_name ? "✅ YES" : "❌ NO"}
                </span>
              </div>

              <div className="pt-2">
                <strong>Condition 2:</strong>{" "}
                session?.user?.user_metadata?.full_name
                <br />
                <span className="ml-4">
                  full_name: "
                  {session?.user?.user_metadata?.full_name || "null"}"
                  {session?.user?.user_metadata?.full_name ? " ✅" : " ❌"}
                </span>
              </div>

              <div className="pt-2">
                <strong>Fallback:</strong> session?.user?.email?.split("@")[0]
                <br />
                <span className="ml-4">
                  email prefix: "{session?.user?.email?.split("@")[0] || "null"}
                  "
                </span>
              </div>
            </div>
          </div>

          {/* Quick Fix Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Quick Fix Suggestions
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                1. If you have a name but it's not showing, check if either
                first_name OR last_name is set in your profile.
              </p>
              <p>
                2. You can update your profile at{" "}
                <a href="/profile" className="text-blue-600 underline">
                  /profile
                </a>{" "}
                or{" "}
                <a href="/studio/profile" className="text-blue-600 underline">
                  /studio/profile
                </a>
              </p>
              <p>
                3. For Google OAuth users, the name should come from
                user_metadata.full_name
              </p>
              <p>
                4. The display logic now shows your name if either first_name OR
                last_name is present.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
