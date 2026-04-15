"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStudioInitialData } from "@/contexts/StudioInitialDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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

export default function StudioPage() {
  const router = useRouter();
  const initialData = useStudioInitialData();
  const initialProfile = initialData?.profile ?? null;
  const { user, loading: authLoading } = useAuth();
  const effectiveRole = initialProfile?.role ?? user?.role ?? null;
  const ownedBrandIds = initialProfile?.owned_brands ?? user?.owned_brands ?? [];

  useEffect(() => {
    if (effectiveRole === "brand_admin") {
      router.replace("/studio/brands");
    }
  }, [effectiveRole, router]);

  if (effectiveRole === "brand_admin") {
    return null;
  }

  if (authLoading && !initialProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!authLoading && !user && !initialProfile) {
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

  if (!effectiveRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Studio</h1>
          <p className="mb-4">Finalizing your studio access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      {/* Welcome Header */}
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-canela text-3xl tracking-tight text-omahub-primary sm:text-4xl">
          Welcome to OmaHub Studio
        </h1>
        <p className="text-base leading-relaxed text-omahub-secondary sm:text-lg">
          Manage your brands, products, and business operations
        </p>
      </header>

      {/* Main Dashboard Components */}
      <div className="grid grid-cols-1 gap-8">
        {/* Leads Dashboard */}
        <Card className="overflow-hidden rounded-2xl border border-oma-beige/60 shadow-sm">
          <CardContent className="bg-white px-5 py-6 sm:px-8 sm:py-8">
            <Suspense
              fallback={
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              }
            >
              <LeadsTrackingDashboard
                userRole={effectiveRole}
                ownedBrandIds={ownedBrandIds}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
