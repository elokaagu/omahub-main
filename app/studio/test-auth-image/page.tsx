"use client";

import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { useState } from "react";

export default function TestAuthImagePage() {
  const { user, signOut } = useAuth();
  const [testImage] = useState(
    "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/test-image.jpg"
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Image Test</h1>

      <div className="grid gap-8">
        {/* Authentication Status */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          <p>User: {user ? "Authenticated" : "Not Authenticated"}</p>
          {user && (
            <Button onClick={() => signOut()} className="mt-2">
              Sign Out
            </Button>
          )}
        </div>

        {/* Test Images */}
        <div className="grid gap-4">
          <div>
            <h2 className="font-semibold mb-2">Test Image (Authenticated)</h2>
            <div className="w-64 h-64 bg-gray-200 rounded-lg overflow-hidden">
              <AuthImage
                src={testImage}
                alt="Test Image"
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Regular Image (Control)</h2>
            <div className="w-64 h-64 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={testImage}
                alt="Control Image"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Sign out to test unauthenticated state</li>
            <li>
              The AuthImage should show a placeholder when unauthenticated
            </li>
            <li>The regular image might still show due to browser caching</li>
            <li>Sign back in to verify the AuthImage loads properly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
