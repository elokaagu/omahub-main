import { supabase } from "../supabase";
import { Provider } from "@supabase/supabase-js";

export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
};

/**
 * Sign up a new user
 */
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

/**
 * Sign in an existing user
 */
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

/**
 * Sign in with OAuth provider (Google, Facebook, etc.)
 */
export async function signInWithOAuth(provider: Provider) {
  try {
    // Simplified approach: let Supabase handle the redirect
    // This bypasses client-side URL construction which can cause issues
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Don't specify redirectTo to let Supabase handle it automatically with Site URL
        // Optional: Add scopes for more user info
        scopes: provider === "google" ? "email profile" : undefined,
        // Use a simple query param to track the flow
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

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }

  return true;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error resetting password:", error);
    throw error;
  }

  return data;
}

/**
 * Get user profile
 */
export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}
