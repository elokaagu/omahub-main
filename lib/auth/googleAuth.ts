import { supabase } from "../supabase";

export interface GoogleSignInOptions {
  redirectTo?: string;
  scopes?: string;
}

/**
 * Sign in with Google using Supabase Auth
 */
export async function signInWithGoogle(options: GoogleSignInOptions = {}) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { redirectTo = `${window.location.origin}/auth/callback` } = options;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      scopes: options.scopes || "email profile",
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Get user error:", error);
    return null;
  }

  return user;
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Get session error:", error);
    return null;
  }

  return session;
}
