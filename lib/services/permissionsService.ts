import { supabase } from "../supabase";
import { adminEmailService } from "./adminEmailService";

export type Permission =
  | "studio.access"
  | "studio.brands.manage"
  | "studio.catalogues.manage"
  | "studio.catalogues.create"
  | "studio.products.manage"
  | "studio.hero.manage"
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
    "studio.hero.manage",
    "studio.settings.manage",
    "studio.users.manage",
  ],
};

// Database-driven permission checking - no more hardcoded emails!
async function getUserRoleFromDatabase(userId: string): Promise<Role | null> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.warn("⚠️ No profile found for user:", userId);
      return null;
    }

    return profile.role as Role;
  } catch (error) {
    console.error("❌ Error fetching user role from database:", error);
    return null;
  }
}

export async function getUserPermissions(
  userId: string,
  userEmail?: string
): Promise<Permission[]> {
  try {
    console.log("🔍 Dynamic Permissions: Getting permissions for user:", userId);

    // First, try to get role from database (most reliable)
    const dbRole = await getUserRoleFromDatabase(userId);
    
    if (dbRole) {
      console.log("✅ Dynamic Permissions: Found role in database:", dbRole);
      return rolePermissions[dbRole] || [];
    }

    // Fallback: Check if user email indicates super_admin access (legacy support)
    if (userEmail && await adminEmailService.isSuperAdmin(userEmail)) {
      console.log("✅ Dynamic Permissions: Super admin email detected, returning super admin permissions");
      return rolePermissions.super_admin;
    }

    // Fallback: Check if user email indicates brand admin access (legacy support)
    if (userEmail && await adminEmailService.isBrandAdmin(userEmail)) {
      console.log("✅ Dynamic Permissions: Brand admin email detected, returning brand admin permissions");
      return rolePermissions.brand_admin;
    }

    console.log("⚠️ Dynamic Permissions: No role found, returning user permissions");
    return rolePermissions.user;
  } catch (error) {
    console.error("❌ Dynamic Permissions: Error getting permissions:", error);
    return rolePermissions.user; // Safe fallback
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

export async function canManageSettings(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes("studio.settings.manage");
}

export async function canManageProducts(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes("studio.products.manage");
}

export async function canManageUsers(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes("studio.users.manage");
}
