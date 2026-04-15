import "server-only";

import { supabaseAdmin } from "../supabase-admin";

export type Permission =
  | "studio.access"
  | "studio.brands.manage"
  | "studio.catalogues.manage"
  | "studio.catalogues.create"
  | "studio.products.manage"
  | "studio.settings.manage"
  | "studio.users.manage";

export type Role = "user" | "brand_admin" | "admin" | "super_admin";

const rolePermissions: Record<Role, Permission[]> = {
  user: [],
  brand_admin: [
    "studio.access",
    "studio.brands.manage",
    "studio.catalogues.manage",
    "studio.catalogues.create",
    "studio.products.manage",
  ],
  admin: ["studio.access", "studio.brands.manage", "studio.catalogues.manage"],
  super_admin: [
    "studio.access",
    "studio.brands.manage",
    "studio.catalogues.manage",
    "studio.catalogues.create",
    "studio.products.manage",
    "studio.settings.manage",
    "studio.users.manage",
  ],
};

// Database-driven permission checking - no more hardcoded emails!
async function getUserRoleFromDatabase(userId: string): Promise<Role | null> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      console.warn("⚠️ Server Permissions: No profile found for user:", userId);
      return null;
    }

    return profile.role as Role;
  } catch (error) {
    console.error("❌ Server Permissions: Error fetching user role from database:", error);
    return null;
  }
}

/** Role from `profiles` only — no email-based privilege fallback. */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    console.log("🔍 Server Permissions: Getting permissions for user:", userId);

    const dbRole = await getUserRoleFromDatabase(userId);

    if (dbRole) {
      console.log("✅ Server Permissions: Found role in database:", dbRole);
      return rolePermissions[dbRole] || [];
    }

    console.log("⚠️ Server Permissions: No role found, returning user permissions");
    return rolePermissions.user;
  } catch (error) {
    console.error("❌ Server Permissions: Error getting permissions:", error);
    return rolePermissions.user;
  }
}

export async function getUserRole(userId: string): Promise<Role> {
  try {
    const dbRole = await getUserRoleFromDatabase(userId);
    return dbRole || "user";
  } catch (error) {
    console.error("❌ Error getting user role:", error);
    return "user";
  }
}

export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
  } catch (error) {
    console.error("❌ Error checking permission:", error);
    return false;
  }
}

export async function hasStudioAccess(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.access");
}

export async function canManageBrands(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.brands.manage");
}

export async function canManageCatalogues(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.catalogues.manage");
}

export async function canManageProducts(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.products.manage");
}

export async function canManageSettings(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.settings.manage");
}

export async function canManageUsers(userId: string): Promise<boolean> {
  return hasPermission(userId, "studio.users.manage");
}
