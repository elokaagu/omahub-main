"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthDebug } from "@/lib/utils/debug";
import { User, getProfile } from "@/lib/services/authService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      AuthDebug.log("🔄 Refreshing user profile for:", session.user.id);
      const profile = await getProfile(session.user.id);
      if (profile) {
        setUser(profile);
        AuthDebug.log("✅ User profile refreshed:", profile.email);
      }
    } catch (error) {
      AuthDebug.error("❌ Error refreshing user profile:", error);
    }
  };

  const loadUserProfile = async (userId: string, email?: string) => {
    try {
      AuthDebug.log("🔄 Loading user profile for:", userId);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile loading timeout")), 10000);
      });

      const profilePromise = getProfile(userId);
      const profile = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as User | null;

      if (profile) {
        setUser(profile);
        AuthDebug.log("✅ User profile loaded:", profile.email);
      } else {
        // If no profile exists, create a basic user object from session data
        const basicUser: User = {
          id: userId,
          email: email || "",
          first_name: "",
          last_name: "",
          avatar_url: "",
          role: "user",
          owned_brands: [],
        };
        setUser(basicUser);
        AuthDebug.log("⚠️ No profile found, created basic user:", email);
      }
    } catch (error) {
      AuthDebug.error("❌ Error loading user profile:", error);
      setUser(null);
    }
  };

  const handleAuthStateChange = async (
    event: string,
    newSession: Session | null
  ) => {
    AuthDebug.log("🔄 Auth state change:", event, { hasSession: !!newSession });

    setSession(newSession);

    if (event === "SIGNED_OUT" || !newSession) {
      setUser(null);
      AuthDebug.log("👋 User signed out");
    } else if (newSession?.user) {
      await loadUserProfile(newSession.user.id, newSession.user.email);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      // Only initialize if we're on the client side
      if (!isClient) {
        return;
      }

      try {
        // Handle case where client is null during SSR
        if (!supabase) {
          AuthDebug.log(
            "⚠️ Supabase client not available, waiting for hydration..."
          );
          // Set a timeout to prevent infinite loading
          setTimeout(() => {
            if (mounted) {
              AuthDebug.log("⏰ Timeout reached, setting loading to false");
              setLoading(false);
            }
          }, 5000);
          return;
        }

        AuthDebug.log("🔍 Initializing auth with Supabase client");

        // Get initial session and validate user
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          AuthDebug.error("❌ Error getting initial session:", sessionError);
        }

        // If we have a session, validate the user with the server for security
        let validatedSession = initialSession;
        if (initialSession) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            AuthDebug.error("❌ Session validation failed:", userError);
            // Session exists but user validation failed - clear the session
            validatedSession = null;
          } else {
            AuthDebug.log("✅ Session validated with server");
          }
        }

        AuthDebug.log("📊 Initial session check:", {
          hasSession: !!validatedSession,
          validated: !!validatedSession,
        });

        if (mounted) {
          await handleAuthStateChange("INITIAL", validatedSession);
          setLoading(false);
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          AuthDebug.log("🔄 Auth state changed:", event);
          setLoading(true);
          await handleAuthStateChange(event, session);
          if (mounted) {
            setLoading(false);
          }
        });

        authSubscription = subscription;
      } catch (error) {
        AuthDebug.error("❌ Error in auth initialization:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [isClient]);

  const signOut = async () => {
    if (!supabase) {
      AuthDebug.error("❌ Cannot sign out: Supabase client not available");
      return;
    }

    try {
      AuthDebug.log("🔄 Signing out...");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        AuthDebug.error("❌ Sign out error:", error);
      } else {
        AuthDebug.log("✅ Sign out successful");
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      AuthDebug.error("❌ Sign out error:", error);
    } finally {
      setLoading(false);
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
