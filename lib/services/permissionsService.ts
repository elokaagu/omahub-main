import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/supabase";
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

// Admin emails are now managed by adminEmailService
async function isSuperAdminEmail(email: string): Promise<boolean> {
  return await adminEmailService.isSuperAdmin(email);
}

async function isBrandAdminEmail(email: string): Promise<boolean> {
  // Check hardcoded list first for immediate access
  const hardcodedBrandAdmins = [
    "eloka@culturin.com",
    "eloka.agu96@gmail.com"  // Added this email
  ];
  
  if (hardcodedBrandAdmins.includes(email)) {
    return true;
  }
  
  // Fallback to adminEmailService
  return await adminEmailService.isBrandAdmin(email);
}

export async function getUserPermissions(
  userId: string,
  userEmail?: string
): Promise<Permission[]> {
  try {
    console.log("🔍 Client Permissions: Getting permissions for user:", userId);
    console.log("🔍 Client Permissions: User email provided:", userEmail);

    // Fast path: If we have the user's email, check for admin roles immediately
    if (userEmail) {
      if (await isSuperAdminEmail(userEmail)) {
        console.log(
          "✅ Client Permissions: Super admin email detected, returning super admin permissions"
        );
        return rolePermissions.super_admin;
      }
      if (await isBrandAdminEmail(userEmail)) {
        console.log(
          "✅ Client Permissions: Brand admin email detected, returning brand admin permissions"
        );
        return rolePermissions.brand_admin;
      }
    }

    const supabase = createClientComponentClient<Database>();

    // Get session and profile data in parallel for better performance
    const [sessionResult, profileResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from("profiles").select("role").eq("id", userId).single(),
    ]);

    const {
      data: { session },
      error: sessionError,
    } = sessionResult;
    const { data: profile, error: profileError } = profileResult;

    console.log("🔍 Client Permissions: Session and profile results:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionError,
      profile,
      profileError,
    });

    if (sessionError) {
      console.error("❌ Client Permissions: Session error:", sessionError);
      // Fallback to email-based permissions if available
      if (userEmail) {
        if (await isSuperAdminEmail(userEmail)) {
          console.log(
            "🔄 Client Permissions: Session failed but super admin email provided"
          );
          return rolePermissions.super_admin;
        }
        if (await isBrandAdminEmail(userEmail)) {
          console.log(
            "🔄 Client Permissions: Session failed but brand admin email provided"
          );
          return rolePermissions.brand_admin;
        }
      }
      return [];
    }

    if (!session) {
      console.error("❌ Client Permissions: No valid session found");
      // Fallback to email-based permissions if available
      if (userEmail) {
        if (await isSuperAdminEmail(userEmail)) {
          console.log(
            "🔄 Client Permissions: No session but super admin email provided"
          );
          return rolePermissions.super_admin;
        }
        if (await isBrandAdminEmail(userEmail)) {
          console.log(
            "🔄 Client Permissions: No session but brand admin email provided"
          );
          return rolePermissions.brand_admin;
        }
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

    if (profileError) {
      console.error(
        "❌ Client Permissions: Error getting user permissions:",
        profileError
      );
      console.error("❌ Client Permissions: Error code:", profileError.code);

      // If profile doesn't exist but we have a valid session, create it with optimized role detection
      if (profileError.code === "PGRST116" && session?.user?.email) {
        console.log(
          "⚠️ Client Permissions: Profile not found, attempting to create..."
        );
        const role = (await isSuperAdminEmail(session.user.email))
          ? "super_admin"
          : (await isBrandAdminEmail(session.user.email))
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

export async function canManageUsers(userId: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes("studio.users.manage");
}
