"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import InboxClient from "./InboxClient";
import { LoadingPage } from "@/components/ui/loading";

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      checkUserProfile();
    }
  }, [user, loading, router]);

  const checkUserProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("/api/auth/profile", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profile = await response.json();

      if (!profile || !["super_admin", "brand_admin"].includes(profile.role)) {
        router.push("/studio");
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load user profile");
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={checkUserProfile}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Access Restricted</h3>
          <p className="text-yellow-600 text-sm mt-1">
            You don't have permission to access the inbox. Only super admins and
            brand admins can view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio Inbox</h1>
        <p className="mt-2 text-gray-600">
          Manage customer inquiries and messages
        </p>
      </div>

      <InboxClient userProfile={userProfile} />
    </div>
  );
}
