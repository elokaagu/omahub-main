import { supabase } from "../supabase";
import { clearRememberMe } from "../utils/rememberMe";

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
    await createProfile(data.user.id, email, "user");
  }

  return data;
}

// Function to create a new profile
async function createProfile(
  userId: string,
  email: string,
  role: UserRole = "user"
) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email: email,
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

    console.log("✅ Login successful, session data received");

    // Don't manually manipulate the session - let Supabase handle it naturally
    // The server-side login should have already set the proper cookies
    
    // If the API signals to refresh the session, reload the page to ensure context is correct
    if (data.refreshSession) {
      console.log("🔄 Refreshing page to sync session state...");
      window.location.reload();
    }

    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
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

  // Clear remember me data on explicit sign out
  clearRememberMe();

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

    // Get user and profile data in parallel for better performance
    const [userResult, profileResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);

    const {
      data: { user },
      error: userError,
    } = userResult;
    const { data: profileData, error: profileError } = profileResult;

    if (userError) {
      console.error("❌ Error getting user:", userError);
      return null;
    }

    console.log("✅ Got auth user:", { id: user?.id, email: user?.email });
    console.log("📊 Profile query result:", {
      data: profileData,
      error: profileError,
    });

    if (profileError) {
      if (profileError.code === "PGRST116") {
        console.log("⚠️ Profile not found, creating new profile");
        // Profile not found, create a new one with optimized role detection
        const userEmail = user?.email || "";
        
        // Try to get role from database first
        let role: string = "user";
        
        try {
          // Check if there's a profile with this email (in case of mismatch)
          const { data: emailProfile, error: emailError } = await supabase
            .from("profiles")
            .select("role")
            .eq("email", userEmail)
            .maybeSingle();
            
          if (!emailError && emailProfile) {
            role = emailProfile.role;
            console.log("✅ Found existing profile by email, using role:", role);
          } else {
            // Fallback to legacy email-based role detection
            const legacySuperAdmins = [
              "eloka.agu@icloud.com",
              "shannonalisa@oma-hub.com",
              "nnamdiohaka@gmail.com",
            ];
            const legacyBrandAdmins = [
              "eloka@culturin.com",
              "eloka.agu96@gmail.com",
            ];

            if (legacySuperAdmins.includes(userEmail)) {
              role = "super_admin";
            } else if (legacyBrandAdmins.includes(userEmail)) {
              role = "brand_admin";
            }
            
            console.log("🔄 Using legacy role detection for:", userEmail, "role:", role);
          }
        } catch (error) {
          console.warn("⚠️ Error in role detection, using default 'user' role");
        }

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: userEmail,
            role: role,
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
          email: newProfile.email || userEmail,
          first_name: newProfile.first_name || "",
          last_name: newProfile.last_name || "",
          avatar_url: newProfile.avatar_url || "",
          role: newProfile.role || "user",
          owned_brands: newProfile.owned_brands || [],
        };
      }
      console.error("❌ Error fetching profile:", profileError);
      return null;
    }

    console.log("✅ Profile fetched successfully:", {
      id: profileData.id,
      role: profileData.role,
      email: profileData.email || user?.email,
      first_name: profileData.first_name,
      owned_brands: profileData.owned_brands?.length || 0,
    });

    const userProfile = {
      id: profileData.id,
      email: profileData.email || user?.email || "",
      first_name: profileData.first_name || "",
      last_name: profileData.last_name || "",
      avatar_url: profileData.avatar_url || "",
      role: profileData.role || "user",
      owned_brands: profileData.owned_brands || [],
    };

    console.log("🎯 Returning profile:", userProfile);
    return userProfile;
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

  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : "http://localhost:3001/reset-password";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error("Error resetting password:", error);
    throw error;
  }

  return true;
}

/**
 * Update user password (used in reset password flow)
 */
export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error updating password:", error);
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
