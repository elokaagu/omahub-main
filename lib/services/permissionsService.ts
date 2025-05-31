import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/supabase";

export type Permission =
  | "studio.access"
  | "studio.brands.manage"
  | "studio.collections.manage"
  | "studio.settings.manage";

export type Role = "user" | "brand_admin" | "admin" | "super_admin";

const rolePermissions: Record<Role, Permission[]> = {
  user: [],
  brand_admin: ["studio.access", "studio.brands.manage"],
  admin: ["studio.access", "studio.brands.manage", "studio.collections.manage"],
  super_admin: [
    "studio.access",
    "studio.brands.manage",
    "studio.collections.manage",
    "studio.settings.manage",
  ],
};

export async function getUserPermissions(
  userId: string
): Promise<Permission[]> {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const role = (profile?.role as Role) || "user";
    return rolePermissions[role] || [];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function hasStudioAccess(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.access");
}

export async function canManageBrands(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.brands.manage");
}

export async function canManageCollections(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.collections.manage");
}

export async function canManageSettings(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.settings.manage");
}
