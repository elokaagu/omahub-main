import type { User, UserRole } from "@/lib/services/authService";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

/** Serializable snapshot from the root Server Component for client auth hydration. */
export type ServerAuthHydration = {
  authUserId: string;
  user: User;
} | null;

function coerceOwnedBrands(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function coerceRole(value: unknown): UserRole {
  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "brand_admin" ||
    value === "user"
  ) {
    return value;
  }
  return "user";
}

/**
 * Reads the current Supabase session from cookies and loads `profiles` once on the server
 * so the client can skip the initial `getProfile` round-trip when IDs match.
 */
export async function getServerAuthHydration(): Promise<ServerAuthHydration> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return null;
    }

    if (!profile) {
      return {
        authUserId: user.id,
        user: {
          id: user.id,
          email: user.email ?? "",
          first_name: "",
          last_name: "",
          avatar_url: "",
          role: "user",
          owned_brands: [],
        },
      };
    }

    return {
      authUserId: user.id,
      user: {
        id: profile.id,
        email: (profile.email as string) || user.email || "",
        first_name: (profile.first_name as string) || "",
        last_name: (profile.last_name as string) || "",
        avatar_url: (profile.avatar_url as string) || "",
        role: coerceRole(profile.role),
        owned_brands: coerceOwnedBrands(profile.owned_brands),
      },
    };
  } catch {
    return null;
  }
}
