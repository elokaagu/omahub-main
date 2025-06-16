"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile, User } from "@/lib/services/authService";
import { AuthDebug } from "@/lib/utils/debug";

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

  // Add refs to prevent excessive refreshes
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_DEBOUNCE_MS = 5000; // 5 seconds minimum between refreshes

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for session refresh signal from authentication callback or email login
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefreshSession = urlParams.get("session_refresh");

    if (shouldRefreshSession === "true" && supabase) {
      AuthDebug.log(
        "🔄 Session refresh signal detected, refreshing session..."
      );

      // Remove the parameter from URL
      urlParams.delete("session_refresh");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);

      // Force refresh the session
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (error) {
          AuthDebug.error("❌ Session refresh failed:", error);
        } else {
          AuthDebug.log("✅ Session refreshed successfully");
          if (data.session) {
            handleAuthStateChange("TOKEN_REFRESHED", data.session);
          }
        }
      });
    }
  }, [isClient]);

  // Memoized refreshUserProfile to prevent recreation on every render
  const refreshUserProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      AuthDebug.log("🔄 Profile refresh already in progress, skipping...");
      return;
    }

    // Debounce rapid successive calls
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_DEBOUNCE_MS) {
      AuthDebug.log("🔄 Profile refresh too recent, skipping...");
      return;
    }

    try {
      isRefreshingRef.current = true;
      lastRefreshTimeRef.current = now;

      AuthDebug.log("🔄 Refreshing user profile for:", session.user.id);
      const profile = await getProfile(session.user.id);
      if (profile) {
        setUser(profile);
        AuthDebug.log("✅ User profile refreshed:", profile.email);
      }
    } catch (error) {
      AuthDebug.error("❌ Error refreshing user profile:", error);
      // Don't disrupt user state on refresh errors - just log and continue
      AuthDebug.log("⚠️ Profile refresh failed, keeping current user state");
    } finally {
      isRefreshingRef.current = false;
    }
  }, [session?.user?.id]); // Only depend on user ID, not the entire session

  const loadUserProfile = async (userId: string, email?: string) => {
    try {
      AuthDebug.log("🔄 Loading user profile for:", userId);

      // Reduce timeout to prevent hanging but allow reasonable time for loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile loading timeout")), 3000);
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
      // Don't set user to null on timeout or temporary errors - create basic user instead
      if (
        error instanceof Error &&
        (error.message === "Profile loading timeout" ||
          error.message.includes("network") ||
          error.message.includes("timeout"))
      ) {
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
        AuthDebug.log("⚠️ Profile loading error, created basic user:", email);
      } else {
        // Only set user to null for actual authentication errors
        AuthDebug.log("❌ Authentication error, setting user to null");
        setUser(null);
      }
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
          // Reduce timeout to prevent long loading states
          setTimeout(() => {
            if (mounted) {
              AuthDebug.log("⏰ Timeout reached, setting loading to false");
              setLoading(false);
            }
          }, 2000);
          return;
        }

        AuthDebug.log("🔍 Initializing auth with Supabase client");

        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          AuthDebug.error("❌ Error getting initial session:", error);
        } else {
          AuthDebug.log("📊 Initial session check:", {
            hasSession: !!initialSession,
          });
        }

        if (mounted) {
          await handleAuthStateChange("INITIAL", initialSession);
          setLoading(false);
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            await handleAuthStateChange(event, session);
          }
        });

        authSubscription = subscription;
      } catch (error) {
        AuthDebug.error("❌ Error initializing auth:", error);
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
    try {
      AuthDebug.log("👋 Signing out...");

      // Clear local state first
      setUser(null);
      setSession(null);

      // Then sign out from Supabase
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          AuthDebug.error("❌ Error signing out:", error);
        } else {
          AuthDebug.log("✅ Successfully signed out");
        }
      }
    } catch (error) {
      AuthDebug.error("❌ Error during sign out:", error);
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
