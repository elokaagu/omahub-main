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
    let timeoutId: NodeJS.Timeout;

    // Clean up any corrupted cookies before initializing auth
    if (typeof window !== "undefined") {
      if (hasCorruptedCookies()) {
        console.log("🧹 Corrupted cookies detected, cleaning up...");
        cleanupCorruptedCookies();
      }
    }

    const initializeAuth = async () => {
      try {
        // Handle case where client is null during SSR
        if (!supabase) {
          AuthDebug.log(
            "Supabase client not available, waiting for hydration..."
          );
          // Set a timeout to prevent infinite loading
          timeoutId = setTimeout(() => {
            if (mounted) {
              AuthDebug.log("Timeout reached, setting loading to false");
              setLoading(false);
            }
          }, 5000);
          return;
        }

        AuthDebug.log("Initializing auth with Supabase client");

        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          AuthDebug.error("Error getting initial session:", error);
        } else {
          AuthDebug.log("Initial session:", { hasSession: !!initialSession });
        }

        if (mounted) {
          setSession(initialSession);

          // Get user profile if session exists
          if (initialSession?.user?.id) {
            const profile = await getProfile(initialSession.user.id);
            setUser(profile);
          } else {
            setUser(null);
          }

          setLoading(false);
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          AuthDebug.log("Auth state changed:", {
            event,
            hasSession: !!session,
          });

          if (mounted) {
            setSession(session);

            // Get user profile if session exists
            if (session?.user?.id) {
              const profile = await getProfile(session.user.id);
              setUser(profile);
            } else {
              setUser(null);
            }

            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        AuthDebug.error("Error in auth initialization:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
