"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStudioPermissions } from "@/hooks/useStudioPermissions";
import { Button } from "@/components/ui/button";
import { StudioAuthPlaceholder } from "@/components/studio/StudioAuthPlaceholder";
import { NavigationLink } from "@/components/ui/navigation-link";

type SuperAdminHeroGateProps = {
  children: React.ReactNode;
  /** Shown in access-denied copy, e.g. "manage hero slides" */
  capabilityPhrase?: string;
};

/**
 * Resolves auth before rendering hero studio surfaces.
 * Avoids masking unauthorized users behind a long-lived loading state.
 */
export function SuperAdminHeroGate({
  children,
  capabilityPhrase = "manage hero slides",
}: SuperAdminHeroGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: permissionsLoading } = useStudioPermissions(
    user?.id
  );

  if (authLoading || permissionsLoading) {
    return <StudioAuthPlaceholder />;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-oma-black mb-2">
          Sign in required
        </h1>
        <p className="text-oma-cocoa mb-6">
          You need to be signed in to {capabilityPhrase}.
        </p>
        <Button asChild>
          <NavigationLink href="/login">Sign in</NavigationLink>
        </Button>
      </div>
    );
  }

  const canManageHero =
    user.role === "super_admin" || permissions.includes("studio.hero.manage");

  if (!canManageHero) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-oma-black mb-2">
          Access denied
        </h1>
        <p className="text-oma-cocoa mb-6">
          Only super admins can {capabilityPhrase}.
        </p>
        <Button asChild>
          <NavigationLink href="/studio">Back to Studio</NavigationLink>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
