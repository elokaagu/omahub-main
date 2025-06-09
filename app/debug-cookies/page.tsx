"use client";

import { useEffect, useState } from "react";

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string>("");
  const [parsedCookies, setParsedCookies] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Parse cookies into object
    const cookieObj: Record<string, string> = {};
    if (allCookies) {
      allCookies.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          cookieObj[name] = decodeURIComponent(value);
        }
      });
    }
    setParsedCookies(cookieObj);
  }, []);

  const refreshCookies = () => {
    window.location.reload();
  };

  const clearAllCookies = () => {
    // Get all cookie names
    const cookieNames = Object.keys(parsedCookies);

    // Clear each cookie
    cookieNames.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

    // Refresh the page
    setTimeout(() => window.location.reload(), 100);
  };

  const supabaseCookies = Object.entries(parsedCookies).filter(
    ([name]) =>
      name.includes("supabase") ||
      name.includes("omahub") ||
      name.includes("auth")
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Cookie Debug
          </h1>

          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={refreshCookies}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh Cookies
              </button>

              <button
                onClick={clearAllCookies}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear All Cookies
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Raw Cookie String</h2>
              <div className="bg-gray-100 p-4 rounded text-sm font-mono break-all">
                {cookies || "No cookies found"}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">
                Auth-Related Cookies
              </h2>
              {supabaseCookies.length > 0 ? (
                <div className="space-y-2">
                  {supabaseCookies.map(([name, value]) => (
                    <div key={name} className="bg-blue-50 p-3 rounded">
                      <div className="font-semibold text-blue-900">{name}</div>
                      <div className="text-sm text-blue-700 font-mono break-all mt-1">
                        {value.length > 100
                          ? `${value.substring(0, 100)}...`
                          : value}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Length: {value.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No auth-related cookies found
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">All Cookies</h2>
              {Object.keys(parsedCookies).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(parsedCookies).map(([name, value]) => (
                    <div key={name} className="bg-gray-50 p-3 rounded">
                      <div className="font-semibold">{name}</div>
                      <div className="text-sm text-gray-600 font-mono break-all mt-1">
                        {value.length > 100
                          ? `${value.substring(0, 100)}...`
                          : value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Length: {value.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">No cookies found</div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Cookie Count</h2>
              <div className="text-lg">
                Total: {Object.keys(parsedCookies).length} cookies
              </div>
              <div className="text-lg">
                Auth-related: {supabaseCookies.length} cookies
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
