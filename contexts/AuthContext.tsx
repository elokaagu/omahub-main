"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthDebug } from "@/lib/utils/debug";
import { getProfile, User } from "@/lib/services/authService";
import {
  cleanupCorruptedCookies,
  hasCorruptedCookies,
} from "@/lib/utils/cookieUtils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const profile = await getProfile(session.user.id);
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      AuthDebug.error("Error refreshing user profile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Clean up any corrupted cookies before initializing
        console.log("🔍 Checking for corrupted cookies...");
        if (hasCorruptedCookies()) {
          console.log("🧹 Found corrupted cookies, cleaning up...");
          cleanupCorruptedCookies();

          // Wait a bit for cleanup to complete
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log("🔐 Initializing authentication...");

        // Check if supabase client is available
        if (!supabase) {
          console.error("❌ Supabase client not available");
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Get initial session with error handling
        let session = null;
        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError) {
            console.error("❌ Session error:", sessionError);
            // If session is corrupted, clean up and try again
            if (
              sessionError.message?.includes("Invalid") ||
              sessionError.message?.includes("JSON")
            ) {
              console.log("🧹 Session corrupted, cleaning up...");
              cleanupCorruptedCookies();
              await new Promise((resolve) => setTimeout(resolve, 100));

              // Try one more time
              const { data: retrySessionData } =
                await supabase.auth.getSession();
              session = retrySessionData?.session;
            }
          } else {
            session = sessionData?.session;
          }
        } catch (error) {
          console.error("❌ Critical session error:", error);
          cleanupCorruptedCookies();
        }

        if (!mounted) return;

        if (session?.user) {
          console.log("✅ User session found:", session.user.email);
          setSession(session);

          try {
            // Fetch user profile
            const profile = await getProfile(session.user.id);
            if (mounted) {
              setUser(profile);
              console.log("✅ User profile loaded:", profile?.role);
            }
          } catch (profileError) {
            console.error("❌ Error loading profile:", profileError);
            // Don't fail auth if profile loading fails
          }
        } else {
          console.log("ℹ️ No active session");
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);

        // If there's a critical error, clean up everything
        if (
          error instanceof Error &&
          (error.message.includes("JSON") ||
            error.message.includes("Invalid") ||
            error.message.includes("Unexpected token"))
        ) {
          console.log("🚨 Critical auth error, performing force cleanup...");
          cleanupCorruptedCookies();
        }

        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener with error handling
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log("🔄 Auth state changed:", event);

          if (!mounted) return;

          if (event === "SIGNED_IN" && session?.user) {
            console.log("✅ User signed in:", session.user.email);
            setSession(session);

            try {
              const profile = await getProfile(session.user.id);
              if (mounted) {
                setUser(profile);
              }
            } catch (profileError) {
              console.error(
                "❌ Error loading profile after sign in:",
                profileError
              );
            }
          } else if (event === "SIGNED_OUT") {
            console.log("👋 User signed out");
            setSession(null);
            setUser(null);

            // Clean up any remaining auth cookies
            cleanupCorruptedCookies();
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            console.log("🔄 Token refreshed for:", session.user.email);
            setSession(session);
          }
        } catch (error) {
          console.error("❌ Auth state change error:", error);

          // Handle corrupted session during state change
          if (
            error instanceof Error &&
            (error.message.includes("JSON") ||
              error.message.includes("Invalid"))
          ) {
            console.log("🧹 Cleaning up corrupted session...");
            cleanupCorruptedCookies();

            if (mounted) {
              setSession(null);
              setUser(null);
            }
          }
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    if (!supabase) {
      AuthDebug.error("Cannot sign out: Supabase client not available");
      return;
    }

    try {
      AuthDebug.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        AuthDebug.error("Sign out error:", error);
      } else {
        AuthDebug.log("Sign out successful");
      }
    } catch (error) {
      AuthDebug.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
