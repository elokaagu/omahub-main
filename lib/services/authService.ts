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
async function createProfile(
  userId: string,
  role: UserRole = "user",
  oauthData?: any
) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  console.log("🆕 Creating profile for user:", {
    userId,
    role,
    hasOAuthData: !!oauthData,
  });

  // Extract name from OAuth data if available
  let firstName = "";
  let lastName = "";
  let avatarUrl = "";

  if (oauthData) {
    // Handle Google OAuth data
    if (oauthData.user_metadata) {
      firstName =
        oauthData.user_metadata.given_name ||
        oauthData.user_metadata.first_name ||
        "";
      lastName =
        oauthData.user_metadata.family_name ||
        oauthData.user_metadata.last_name ||
        "";
      avatarUrl =
        oauthData.user_metadata.avatar_url ||
        oauthData.user_metadata.picture ||
        "";

      console.log("📊 Extracted OAuth profile data:", {
        firstName,
        lastName,
        avatarUrl: avatarUrl ? "present" : "missing",
        fullMetadata: oauthData.user_metadata,
      });
    }

    // Fallback: try to extract name from full_name
    if (!firstName && !lastName && oauthData.user_metadata?.full_name) {
      const nameParts = oauthData.user_metadata.full_name.split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
      console.log("📝 Extracted name from full_name:", { firstName, lastName });
    }
  }

  const profileData = {
    id: userId,
    email: oauthData?.email || "",
    first_name: firstName,
    last_name: lastName,
    avatar_url: avatarUrl,
    role,
    owned_brands: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("💾 Creating profile with data:", profileData);

  const { error } = await supabase.from("profiles").insert(profileData);

  if (error && error.code !== "23505") {
    // Ignore duplicate key errors
    console.error("❌ Error creating profile:", error);
    throw error;
  }

  console.log("✅ Profile created successfully");
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
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Prevent multiple simultaneous OAuth requests using the new helper
    const { isOAuthInProgress, setOAuthProgress, handleAuthError } =
      await import("@/lib/supabase");

    if (isOAuthInProgress()) {
      console.log("⏳ OAuth already in progress, skipping...");
      return;
    }

    setOAuthProgress(true);

    console.log("🚀 Starting enhanced OAuth flow with:", {
      provider,
      origin:
        typeof window !== "undefined" ? window.location.origin : "unknown",
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
      userAgent:
        typeof window !== "undefined" ? navigator.userAgent : "unknown",
      timestamp: new Date().toISOString(),
    });

    // Clear any existing session storage flags
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oauth_error");
      sessionStorage.setItem("oauth_start_time", Date.now().toString());
    }

    // Log current cookies before OAuth
    if (typeof window !== "undefined") {
      console.log("🍪 Pre-OAuth state:", {
        allCookies: document.cookie,
        supabaseCookies: document.cookie
          .split(";")
          .filter((c) => c.includes("sb-")),
        localStorage: {
          hasAuthToken: !!localStorage.getItem("sb-auth-token"),
          authTokenLength: localStorage.getItem("sb-auth-token")?.length || 0,
        },
      });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
        scopes: provider === "google" ? "email profile" : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
          // Add additional parameters for better OAuth flow
          include_granted_scopes: "true",
          state: `oauth_${Date.now()}`, // Add state for security
        },
      },
    });

    console.log("📊 Enhanced OAuth initiation result:", {
      hasData: !!data,
      hasUrl: !!data?.url,
      hasProvider: !!data?.provider,
      error: error?.message,
      urlPreview: data?.url ? data.url.substring(0, 150) + "..." : "none",
      provider: data?.provider,
    });

    if (error) {
      console.error(`❌ OAuth initiation error for ${provider}:`, {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error,
      });
      setOAuthProgress(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("oauth_error", error.message);
      }
      handleAuthError(error);
      return;
    }

    // Log successful OAuth initiation
    if (typeof window !== "undefined") {
      setTimeout(() => {
        console.log("🍪 Post-OAuth initiation state:", {
          allCookies: document.cookie,
          supabaseCookies: document.cookie
            .split(";")
            .filter((c) => c.includes("sb-")),
          localStorage: {
            hasAuthToken: !!localStorage.getItem("sb-auth-token"),
            authTokenLength: localStorage.getItem("sb-auth-token")?.length || 0,
          },
        });
      }, 100);
    }

    console.log("🎯 OAuth redirect initiated successfully for", provider);
    return data;
  } catch (err) {
    console.error(`💥 Exception in signInWithOAuth for ${provider}:`, err);
    const { setOAuthProgress, handleAuthError } = await import(
      "@/lib/supabase"
    );
    setOAuthProgress(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauth_error", String(err));
    }
    handleAuthError(err);
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
    console.log("🔍 Enhanced profile fetch for user:", userId);

    if (!supabase) {
      console.error("❌ Supabase client not available");
      return null;
    }

    // First get the user's auth data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Error getting auth user:", userError);
      return null;
    }

    console.log("✅ Got auth user:", {
      id: user?.id,
      email: user?.email,
      hasUserMetadata: !!user?.user_metadata,
      userMetadata: user?.user_metadata,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("📊 Profile query result:", {
      hasData: !!data,
      error: error?.message,
      errorCode: error?.code,
    });

    if (error) {
      if (error.code === "PGRST116") {
        console.log(
          "⚠️ Profile not found, creating new profile with OAuth data"
        );

        // Create profile with OAuth data if available
        await createProfile(userId, "user", user);

        // Fetch the newly created profile
        const { data: newProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("❌ Error fetching newly created profile:", fetchError);
          return null;
        }

        console.log("✅ New profile created and fetched:", newProfile);
        return formatUserProfile(newProfile, user);
      }
      console.error("❌ Error fetching profile:", error);
      return null;
    }

    console.log("✅ Profile fetched successfully:", {
      id: data.id,
      role: data.role,
      email: data.email || user?.email,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
      owned_brands: data.owned_brands?.length || 0,
    });

    return formatUserProfile(data, user);
  } catch (err) {
    console.error("❌ Exception in getProfile:", err);
    return null;
  }
}

// Helper function to format user profile consistently
function formatUserProfile(profileData: any, authUser: any): User {
  const profile = {
    id: profileData.id,
    email: profileData.email || authUser?.email || "",
    first_name: profileData.first_name || "",
    last_name: profileData.last_name || "",
    avatar_url: profileData.avatar_url || "",
    role: profileData.role || "user",
    owned_brands: profileData.owned_brands || [],
  };

  console.log("🎯 Formatted user profile:", profile);
  return profile;
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
