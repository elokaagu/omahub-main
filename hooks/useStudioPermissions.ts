"use client";

import { useEffect, useState } from "react";
import {
  getUserPermissions,
  type Permission,
} from "@/lib/services/permissionsService";

/**
 * Loads DB-backed permissions for the signed-in user so UI can reflect
 * studio.access even when AuthContext role is briefly stale.
 */
export function useStudioPermissions(
  userId: string | undefined,
  email: string | undefined
) {
  const [permissions, setPermissions] = useState<Permission[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setPermissions(null);
      return;
    }
    let cancelled = false;
    getUserPermissions(userId, email)
      .then((p) => {
        if (!cancelled) setPermissions(p);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  const hasStudioAccess = Boolean(permissions?.includes("studio.access"));
  const loading = permissions === null;

  return { permissions: permissions ?? [], hasStudioAccess, loading };
}
