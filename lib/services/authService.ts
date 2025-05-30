import { supabase } from "../supabase";
import { Provider } from "@supabase/supabase-js";

export type UserRole = "admin" | "brand_owner" | "user";

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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error signing in:", error);
    throw error;
  }

  // Ensure profile exists
  if (data.user) {
    const profile = await getProfile(data.user.id);
    if (!profile) {
      await createProfile(data.user.id);
    }
  }

  return data;
}

export async function signInWithOAuth(provider: Provider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        scopes: provider === "google" ? "email profile" : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`Error in signInWithOAuth:`, err);
    throw err;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }

  return true;
}

export async function getCurrentUser() {
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
    const { data, error } = await supabase
      .from("profiles")
      .select("*, owned_brands")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile not found, create a new one
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            role: "user",
            owned_brands: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          return null;
        }

        return newProfile;
      }
      console.error("Error fetching profile:", error);
      return null;
    }

    return {
      id: data.id,
      email: data.email || "",
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
      role: data.role || "user",
      owned_brands: data.owned_brands || [],
    };
  } catch (err) {
    console.error("Error in getProfile:", err);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<User>) {
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
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error resetting password:", error);
    throw error;
  }

  return data;
}

export async function addOwnedBrand(userId: string, brandId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("owned_brands")
    .eq("id", userId)
    .single();

  const ownedBrands = profile?.owned_brands || [];

  if (!ownedBrands.includes(brandId)) {
    const { error } = await supabase
      .from("profiles")
      .update({
        owned_brands: [...ownedBrands, brandId],
        role: "brand_owner", // Automatically promote to brand owner
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error adding owned brand:", error);
      throw error;
    }
  }
}

export async function removeOwnedBrand(userId: string, brandId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("owned_brands")
    .eq("id", userId)
    .single();

  const ownedBrands = profile?.owned_brands || [];
  const updatedBrands = ownedBrands.filter((id: string) => id !== brandId);

  const { error } = await supabase
    .from("profiles")
    .update({
      owned_brands: updatedBrands,
      role: updatedBrands.length === 0 ? "user" : "brand_owner", // Demote to user if no brands left
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error removing owned brand:", error);
    throw error;
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data?.role === "admin";
  } catch (err) {
    console.error("Error in isAdmin check:", err);
    return false;
  }
}
