import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/supabase";

export type Permission =
  | "studio.access"
  | "studio.brands.manage"
  | "studio.catalogues.manage"
  | "studio.catalogues.create"
  | "studio.products.manage"
  | "studio.settings.manage";

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
  ],
};

const SUPER_ADMIN_EMAILS = ["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"];
const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];

function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email);
}

function isBrandAdminEmail(email: string): boolean {
  return BRAND_ADMIN_EMAILS.includes(email);
}

export async function getUserPermissions(
  userId: string,
  userEmail?: string
): Promise<Permission[]> {
  try {
    console.log("🔍 Client Permissions: Getting permissions for user:", userId);
    console.log("🔍 Client Permissions: User email provided:", userEmail);

    // If we have the user's email and it's a super admin, return super admin permissions immediately
    if (userEmail && isSuperAdminEmail(userEmail)) {
      console.log(
        "✅ Client Permissions: Super admin email detected, returning super admin permissions"
      );
      return rolePermissions.super_admin;
    }

    // If we have the user's email and it's a brand admin, return brand admin permissions immediately
    if (userEmail && isBrandAdminEmail(userEmail)) {
      console.log(
        "✅ Client Permissions: Brand admin email detected, returning brand admin permissions"
      );
      return rolePermissions.brand_admin;
    }

    const supabase = createClientComponentClient<Database>();

    // First, verify we have a valid session
    console.log("🔍 Client Permissions: Checking session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("🔍 Client Permissions: Session check result:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionError,
    });

    if (sessionError) {
      console.error("❌ Client Permissions: Session error:", sessionError);
      // If session fails but we have user email, try to determine role from email
      if (userEmail && isSuperAdminEmail(userEmail)) {
        console.log(
          "🔄 Client Permissions: Session failed but super admin email provided, returning super admin permissions"
        );
        return rolePermissions.super_admin;
      }
      if (userEmail && isBrandAdminEmail(userEmail)) {
        console.log(
          "🔄 Client Permissions: Session failed but brand admin email provided, returning brand admin permissions"
        );
        return rolePermissions.brand_admin;
      }
      return [];
    }

    if (!session) {
      console.error("❌ Client Permissions: No valid session found");
      // If no session but we have user email, try to determine role from email
      if (userEmail && isSuperAdminEmail(userEmail)) {
        console.log(
          "🔄 Client Permissions: No session but super admin email provided, returning super admin permissions"
        );
        return rolePermissions.super_admin;
      }
      if (userEmail && isBrandAdminEmail(userEmail)) {
        console.log(
          "🔄 Client Permissions: No session but brand admin email provided, returning brand admin permissions"
        );
        return rolePermissions.brand_admin;
      }
      return [];
    }

    if (session.user.id !== userId) {
      console.error("❌ Client Permissions: Session user ID mismatch", {
        sessionUserId: session.user.id,
        requestedUserId: userId,
      });
      return [];
    }

    console.log(
      "🔍 Client Permissions: Supabase client created, querying profiles..."
    );
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("🔍 Client Permissions: Profile query result:", {
      profile,
      error,
    });

    if (error) {
      console.error(
        "❌ Client Permissions: Error getting user permissions:",
        error
      );
      console.error("❌ Client Permissions: Error code:", error.code);
      console.error("❌ Client Permissions: Error message:", error.message);

      // If profile doesn't exist but we have a valid session, create it
      if (error.code === "PGRST116" && session?.user?.email) {
        console.log(
          "⚠️ Client Permissions: Profile not found, attempting to create..."
        );
        const role = isSuperAdminEmail(session.user.email)
          ? "super_admin"
          : isBrandAdminEmail(session.user.email)
            ? "brand_admin"
            : "user";

        const { error: createError } = await supabase.from("profiles").insert({
          id: userId,
          email: session.user.email,
          role: role,
          owned_brands: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createError) {
          console.error(
            "❌ Client Permissions: Error creating profile:",
            createError
          );
          return [];
        }

        console.log("✅ Client Permissions: Profile created successfully");
        return rolePermissions[role as Role] || [];
      }

      return [];
    }

    const userRole = profile?.role as Role;
    console.log("🔍 Client Permissions: User role from database:", userRole);

    if (!userRole || !rolePermissions[userRole]) {
      console.error(
        "❌ Client Permissions: Invalid or missing role:",
        userRole
      );
      return [];
    }

    const permissions = rolePermissions[userRole];
    console.log("✅ Client Permissions: Returning permissions:", permissions);
    return permissions;
  } catch (error) {
    console.error("❌ Client Permissions: Unexpected error:", error);
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
