import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function getUserPermissions(
  userId: string,
  userEmail?: string
): Promise<Permission[]> {
  try {
    console.log("🔍 Server Permissions: Getting permissions for user:", userId);

    // Auto-assign super admin role for specific emails
    if (userEmail && isSuperAdminEmail(userEmail)) {
      console.log(
        "✅ Server Permissions: Super admin email detected, returning super admin permissions"
      );
      return rolePermissions.super_admin;
    }

    // Auto-assign brand admin role for specific emails
    if (userEmail && isBrandAdminEmail(userEmail)) {
      console.log(
        "✅ Server Permissions: Brand admin email detected, returning brand admin permissions"
      );
      return rolePermissions.brand_admin;
    }

    const supabase = createSupabaseClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Error getting user permissions:", error);

      // If profile doesn't exist, create it with default role
      if (error.code === "PGRST116") {
        console.log("⚠️ Profile not found, creating default profile");

        // Get user email from auth
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && user && user.email) {
          // Check if this is a super admin email
          const role = isSuperAdminEmail(user.email)
            ? "super_admin"
            : isBrandAdminEmail(user.email)
              ? "brand_admin"
              : "user";

          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: user.email,
              role: role,
              owned_brands: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (createError) {
            console.error("❌ Error creating profile:", createError);
            return [];
          }

          console.log(`✅ Created ${role} profile for user`);
          return rolePermissions[role];
        }
      }

      return [];
    }

    const role = (profile?.role as Role) || "user";
    console.log("✅ User role:", role);
    return rolePermissions[role] || [];
  } catch (error) {
    console.error("❌ Error getting user permissions:", error);
    return [];
  }
}

export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  const hasAccess = permissions.includes(permission);
  console.log(`🔐 Permission check: ${permission} = ${hasAccess}`);
  return hasAccess;
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
