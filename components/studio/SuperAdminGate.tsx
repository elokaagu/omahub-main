"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStudioPermissions } from "@/hooks/useStudioPermissions";
import { useStudioEffectiveRole } from "@/hooks/useStudioEffectiveRole";
import { Button } from "@/components/ui/button";
import { StudioAuthPlaceholder } from "@/components/studio/StudioAuthPlaceholder";
import { NavigationLink } from "@/components/ui/navigation-link";

type SuperAdminHeroGateProps = {
  children: React.ReactNode;
  /** Shown in access-denied copy, e.g. "manage hero slides" */
  capabilityPhrase?: string;
};

/**
 * Resolves auth before rendering super-admin studio surfaces.
 * Uses the SSR profile role so a stale AuthContext "user" role does not
 * flash Access Denied.
 */
export function SuperAdminHeroGate({
  children,
  capabilityPhrase = "manage hero slides",
}: SuperAdminHeroGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin } = useStudioEffectiveRole();
  const { permissions, loading: permissionsLoading } = useStudioPermissions(
    user?.id
  );

  const canManageHero =
    isSuperAdmin || permissions.includes("studio.hero.manage");

  if ((authLoading && !isSuperAdmin) || (permissionsLoading && !canManageHero)) {
    return <StudioAuthPlaceholder />;
  }

  if (!user && !isSuperAdmin) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-gray-900 mb-2">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-6">
          You need to be signed in to {capabilityPhrase}.
        </p>
        <Button asChild>
          <NavigationLink href="/login">Sign in</NavigationLink>
        </Button>
      </div>
    );
  }

  if (!canManageHero) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-gray-900 mb-2">
          Access denied
        </h1>
        <p className="text-gray-600 mb-6">
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
