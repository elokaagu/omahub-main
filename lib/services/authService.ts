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

  return data;
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*, owned_brands")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Record not found
      // Create a new profile with user role
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

  return data;
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
