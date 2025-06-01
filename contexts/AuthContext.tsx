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

  const refreshUserProfile = async () => {
    if (!session?.user?.id) {
      console.log("🔄 No session user ID available for profile refresh");
      return;
    }

    try {
      console.log("🔄 Refreshing user profile for:", session.user.id);
      const profile = await getProfile(session.user.id);
      if (profile) {
        console.log("✅ Profile refreshed successfully:", {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          hasAvatar: !!profile.avatar_url,
        });
        setUser(profile);
      } else {
        console.log("⚠️ No profile returned from refresh");
      }
    } catch (error) {
      AuthDebug.error("Error refreshing user profile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

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

        AuthDebug.log("🚀 Initializing enhanced auth with Supabase client");

        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          AuthDebug.error("Error getting initial session:", error);
        } else {
          AuthDebug.log("Initial session check:", {
            hasSession: !!initialSession,
            userEmail: initialSession?.user?.email,
            hasUserMetadata: !!initialSession?.user?.user_metadata,
          });
        }

        if (mounted) {
          setSession(initialSession);

          // Get user profile if session exists
          if (initialSession?.user?.id) {
            console.log("👤 Fetching initial user profile...");
            const profile = await getProfile(initialSession.user.id);
            if (profile) {
              console.log("✅ Initial profile loaded:", {
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                displayName: profile.first_name
                  ? `${profile.first_name}`
                  : "My Account",
              });
            }
            setUser(profile);
          } else {
            setUser(null);
          }

          setLoading(false);
        }

        // Listen for auth changes with enhanced handling
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          AuthDebug.log("🔄 Auth state changed:", {
            event,
            hasSession: !!session,
            userEmail: session?.user?.email,
            hasUserMetadata: !!session?.user?.user_metadata,
          });

          if (mounted) {
            setSession(session);

            // Get user profile if session exists
            if (session?.user?.id) {
              console.log("👤 Auth state change - fetching user profile...");

              // Add a small delay to ensure database operations are complete
              setTimeout(async () => {
                const profile = await getProfile(session.user.id);
                if (profile) {
                  console.log("✅ Profile loaded after auth change:", {
                    id: profile.id,
                    email: profile.email,
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    displayName: profile.first_name
                      ? `${profile.first_name}`
                      : "My Account",
                  });
                }
                setUser(profile);
              }, 500); // Small delay to ensure profile creation is complete
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
      AuthDebug.log("🚪 Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        AuthDebug.error("Sign out error:", error);
      } else {
        AuthDebug.log("✅ Sign out successful");
        // Clear user state immediately
        setUser(null);
        setSession(null);
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

  // Debug current auth state
  useEffect(() => {
    if (!loading) {
      console.log("🎯 Current auth state:", {
        hasUser: !!user,
        hasSession: !!session,
        userEmail: user?.email,
        userName: user?.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : "No name",
        userRole: user?.role,
      });
    }
  }, [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
