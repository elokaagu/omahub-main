import { supabase } from "../supabase";
import { Provider } from "@supabase/supabase-js";

export type UserRole = "user" | "admin" | "super_admin" | "brand_admin";

export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: UserRole;
  owned_brands?: string[]; // Array of brand IDs owned by this user
};

// Rate limiting for OAuth attempts
let lastOAuthAttempt = 0;
const OAUTH_COOLDOWN = 5000; // 5 seconds between attempts

// Client-side auth functions
export async function signUp(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error signing up:", error);
    throw error;
  }

  // Create a profile for the new user
  if (data.user) {
    await createProfile(data.user.id, "user");
  }

  return data;
}

// Function to create a new profile
async function createProfile(userId: string, role: UserRole = "user") {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    role,
    owned_brands: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error && error.code !== "23505") {
    // Ignore duplicate key errors
    console.error("Error creating profile:", error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Use the server-side login API for proper session handling
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signInWithOAuth(provider: Provider) {
  try {
    console.log(`🔐 Starting OAuth sign-in with ${provider}`);

    // Rate limiting check
    const now = Date.now();
    if (now - lastOAuthAttempt < OAUTH_COOLDOWN) {
      const waitTime = Math.ceil(
        (OAUTH_COOLDOWN - (now - lastOAuthAttempt)) / 1000
      );
      throw new Error(`Please wait ${waitTime} seconds before trying again`);
    }
    lastOAuthAttempt = now;

    if (!supabase) {
      console.error("❌ Supabase client not available");
      throw new Error("Supabase client not available");
    }

    // Check if we're in the browser
    if (typeof window === "undefined") {
      console.error("❌ OAuth sign-in must be called from browser");
      throw new Error("OAuth sign-in must be called from browser");
    }

    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log(`🔗 Using redirect URL: ${redirectUrl}`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        scopes: provider === "google" ? "email profile" : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error(`❌ Error signing in with ${provider}:`, error);

      // Handle specific error types
      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("429")
      ) {
        throw new Error(
          "Too many authentication attempts. Please wait a moment and try again."
        );
      }

      throw error;
    }

    console.log(`✅ OAuth sign-in initiated successfully for ${provider}`);
    console.log("📊 OAuth data:", data);

    return data;
  } catch (err) {
    console.error(`❌ Error in signInWithOAuth:`, err);
    throw err;
  }
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }

  return true;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  return user;
}

export async function getProfile(userId: string): Promise<User | null> {
  try {
    console.log("🔍 Fetching profile for user:", userId);

    if (!supabase) {
      console.error("❌ Supabase client not available");
      return null;
    }

    // First get the user's email from auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Error getting user:", userError);
      return null;
    }

    console.log("✅ Got auth user:", { id: user?.id, email: user?.email });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("📊 Profile query result:", { data, error });

    if (error) {
      if (error.code === "PGRST116") {
        console.log("⚠️ Profile not found, creating new profile");
        // Profile not found, create a new one
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: user?.email || "",
            role: "user",
            owned_brands: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Error creating profile:", createError);
          return null;
        }

        console.log("✅ New profile created:", newProfile);
        return {
          id: newProfile.id,
          email: newProfile.email || user?.email || "",
          first_name: newProfile.first_name || "",
          last_name: newProfile.last_name || "",
          avatar_url: newProfile.avatar_url || "",
          role: newProfile.role || "user",
          owned_brands: newProfile.owned_brands || [],
        };
      }
      console.error("❌ Error fetching profile:", error);
      return null;
    }

    console.log("✅ Profile fetched successfully:", {
      id: data.id,
      role: data.role,
      email: data.email || user?.email,
      first_name: data.first_name,
      owned_brands: data.owned_brands?.length || 0,
    });

    const profileResult = {
      id: data.id,
      email: data.email || user?.email || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      avatar_url: data.avatar_url || "",
      role: data.role || "user",
      owned_brands: data.owned_brands || [],
    };

    console.log("🎯 Returning profile:", profileResult);
    return profileResult;
  } catch (err) {
    console.error("❌ Error in getProfile:", err);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}

export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error("Error resetting password:", error);
    throw error;
  }

  return true;
}

export async function addOwnedBrand(userId: string, brandId: string) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // First get current owned_brands
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("owned_brands")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
    throw fetchError;
  }

  const currentBrands = profile?.owned_brands || [];
  if (!currentBrands.includes(brandId)) {
    const { error } = await supabase
      .from("profiles")
      .update({
        owned_brands: [...currentBrands, brandId],
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error adding owned brand:", error);
      throw error;
    }
  }

  return true;
}

export async function removeOwnedBrand(userId: string, brandId: string) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // First get current owned_brands
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("owned_brands")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
    throw fetchError;
  }

  const currentBrands = profile?.owned_brands || [];
  const updatedBrands = currentBrands.filter((id: string) => id !== brandId);

  const { error } = await supabase
    .from("profiles")
    .update({
      owned_brands: updatedBrands,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error removing owned brand:", error);
    throw error;
  }

  return true;
}

export async function isAdmin(userId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data?.role === "admin" || data?.role === "super_admin";
}
