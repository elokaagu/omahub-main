"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStudioInitialData } from "@/contexts/StudioInitialDataContext";

/**
 * Studio pages must not trust AuthContext.role alone: it hydrates as "user"
 * until the profile loads, which falsely locks super admins out of Spotlight,
 * Waitlist, FAQs, and similar gates.
 */
export function useStudioEffectiveRole() {
  const initialData = useStudioInitialData();
  const { user, loading } = useAuth();
  const clientRole =
    user?.role && user.role !== "user" ? user.role : user?.role ?? null;
  const role =
    initialData?.profile?.role ?? initialData?.user?.role ?? clientRole ?? null;

  return {
    role,
    user,
    loading,
    isSuperAdmin: role === "super_admin",
  };
}
