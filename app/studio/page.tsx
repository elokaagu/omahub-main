"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { supabaseHelpers } from "@/lib/utils/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Phase 2B: Selective icon imports instead of large lucide-react bundle
import { BarChart3 } from "@/lib/utils/iconImports";
import Link from "next/link";
import type { Database } from "@/lib/types/supabase";
import NotificationsWidget from "@/components/studio/NotificationsWidget";
import GoogleAnalyticsDashboard from "@/components/studio/GoogleAnalyticsDashboard";
import { engagement } from "@/lib/config/analytics";

// Dynamic imports for heavy components
const LeadsTrackingDashboard = dynamic(
  () => import("@/components/studio/LeadsTrackingDashboard"),
  {
    loading: () => (
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
    ),
    ssr: false,
  }
);

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function StudioPage() {
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          console.log("👤 Studio Page: No user found");
          setLoading(false);
          return;
        }

        // Get user permissions and profile directly without refreshing
        const [permissions, profileResult] = await Promise.all([
          getUserPermissions(user.id, user.email),
          supabaseHelpers.getProfileById(user.id),
        ]);

        setUserPermissions(permissions);

        let profile = profileResult.data;

        if (profileResult.error) {
          console.error(
            "❌ Studio Page: Error fetching profile:",
            profileResult.error
          );
          console.log("🔄 Studio Page: Using user context as fallback");
          // Use user context as fallback
          profile = {
            id: user.id,
            email: user.email,
            role: user.role || "user",
            owned_brands: user.owned_brands || [],
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            avatar_url: user.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
          setUserProfile(profile);
        } else {
          console.log("👤 Studio Page: Profile fetched:", {
            role: profile?.role,
            ownedBrands: profile?.owned_brands,
          });
          setUserProfile(profile);
        }

        // Track Studio access in Google Analytics
        if (profile?.role) {
          engagement.studioAccess(profile.role);
        }
      } catch (error) {
        console.error("❌ Studio Page: Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch data when user changes
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Enhanced skeleton loading with better visual hierarchy */}
        <div className="space-y-4">
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analytics Card Skeleton */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to access the studio.</p>
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-omahub-primary mb-2">
          Welcome to OmaHub Studio
        </h1>
        <p className="text-lg text-omahub-secondary">
          Manage your brands, products, and business operations
        </p>
        {userProfile?.role === "super_admin" && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              Analytics Dashboard Available - Super Admin Access
            </span>
          </div>
        )}
      </div>

      {/* Main Dashboard Components */}
      <div className="space-y-8">
        {/* Leads Dashboard - Full Width */}
        <Card className="border-omahub-accent shadow-omahub">
          <CardHeader className="bg-gradient-to-r from-omahub-primary to-omahub-secondary text-white rounded-t-lg">
            <CardTitle className="text-white">Leads & Conversions</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <Suspense
              fallback={
                <div className="h-64 bg-omahub-light rounded-lg animate-pulse" />
              }
            >
              <LeadsTrackingDashboard
                userRole={userProfile?.role || "user"}
                ownedBrandIds={userProfile?.owned_brands || []}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Notifications Widget - Full Width Below */}
        <NotificationsWidget />

        {/* Google Analytics Dashboard - Super Admin Only */}
        {userProfile?.role === "super_admin" && <GoogleAnalyticsDashboard />}
      </div>
    </div>
  );
}
