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
import { createClient } from "@/lib/supabase-unified";
import { getProfile, User, UserRole } from "@/lib/services/authService";
import { AuthDebug } from "@/lib/utils/debug";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  attemptSessionRecovery: () => Promise<boolean>;
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

  // Helper function to determine role based on email (legacy fallback only)
  const getRoleFromEmail = (email: string): UserRole => {
    // This is now only used as a fallback when database lookup fails
    const legacySuperAdmins = [
      "eloka.agu@icloud.com",
      "shannonalisa@oma-hub.com",
      "nnamdiohaka@gmail.com",
    ];
    const legacyBrandAdmins = [
      "eloka@culturin.com", 
      "eloka.agu96@gmail.com",
      "team@houseofagu.com"
    ];

    if (legacySuperAdmins.includes(email)) {
      return "super_admin";
    }
    if (legacyBrandAdmins.includes(email)) {
      return "brand_admin";
    }
    return "user";
  };

  // Helper function to get owned brands based on email (legacy fallback only)
  const getOwnedBrandsFromEmail = (email: string): string[] => {
    // This is now only used as a fallback when database lookup fails
    if (email === "eloka@culturin.com") {
      return ["ehbs-couture"];
    }
    return [];
  };

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for session refresh signal from authentication callback or email login
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefreshSession = urlParams.get("session_refresh");

    if (shouldRefreshSession === "true") {
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
      const supabase = createClient();
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
        // If no profile exists, create a basic user object with proper role detection
        const userEmail = email || "";
        const role = getRoleFromEmail(userEmail);

        const basicUser: User = {
          id: userId,
          email: userEmail,
          first_name: "",
          last_name: "",
          avatar_url: "",
          role: role,
          owned_brands: [], // Start with empty array, will be populated from database
        };
        setUser(basicUser);
        AuthDebug.log(
          "⚠️ No profile found, created basic user with role:",
          role,
          userEmail
        );
      }
    } catch (error) {
      AuthDebug.error("❌ Error loading user profile:", error);
      // Don't set user to null on timeout or temporary errors - create basic user with proper role instead
      if (
        error instanceof Error &&
        (error.message === "Profile loading timeout" ||
          error.message.includes("network") ||
          error.message.includes("timeout"))
      ) {
        const userEmail = email || "";
        const role = getRoleFromEmail(userEmail);

        const basicUser: User = {
          id: userId,
          email: userEmail,
          first_name: "",
          last_name: "",
          avatar_url: "",
          role: role,
          owned_brands: [], // Start with empty array, will be populated from database
        };
        setUser(basicUser);
        AuthDebug.log(
          "⚠️ Profile loading error, created basic user with role:",
          role,
          userEmail
        );
      } else {
        // Only set user to null for actual authentication errors
        AuthDebug.log("❌ Authentication error, setting user to null");
        setUser(null);
      }
    }
  };

  // Memoized handleAuthStateChange to prevent infinite loops
  const handleAuthStateChange = useCallback(
    async (event: string, newSession: Session | null) => {
      AuthDebug.log("🔄 Auth state change:", event, {
        hasSession: !!newSession,
      });

      setSession(newSession);

      if (event === "SIGNED_OUT" || !newSession) {
        setUser(null);
        AuthDebug.log("👋 User signed out");
      } else if (newSession?.user) {
        await loadUserProfile(newSession.user.id, newSession.user.email);
      }
    },
    []
  ); // Empty dependency array since it doesn't depend on external values

  // Set up auth state listener with enhanced session handling
  useEffect(() => {
    if (!isClient) return;

    AuthDebug.log("🔄 Setting up enhanced auth state listener...");

    const supabase = createClient();

    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          AuthDebug.error("❌ Initial session error:", error);
          // Don't fail completely on session error, try to recover
          setLoading(false);
          return;
        }

        if (session) {
          AuthDebug.log("✅ Initial session found:", session.user.email);
          await handleAuthStateChange("INITIAL_SESSION", session);
        } else {
          AuthDebug.log("ℹ️  No initial session found");
        }

        setLoading(false);
      } catch (error) {
        AuthDebug.error("❌ Unexpected error getting initial session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with enhanced error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      AuthDebug.log("🔄 Auth state change:", event, {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      try {
        await handleAuthStateChange(event, session);
      } catch (error) {
        AuthDebug.error("❌ Error handling auth state change:", error);
        // Don't let auth errors crash the app
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isClient]); // Removed handleAuthStateChange from dependencies

  // Set up profile updates subscription - simplified to prevent loops
  useEffect(() => {
    if (!session?.user?.id || !isClient) return;

    AuthDebug.log(
      "🔄 Setting up profile updates subscription for:",
      session.user.id
    );

    const supabase = createClient();
    const profileSubscription = supabase
      .channel(`profile_updates_${session.user.id}`)
      .on("broadcast", { event: "profile_updated" }, async (payload: any) => {
        AuthDebug.log("🔄 Profile update received:", payload);
        // Use a timeout to prevent immediate re-renders
        setTimeout(() => {
          refreshUserProfile();
        }, 100);
      })
      .subscribe((status: any) => {
        AuthDebug.log("📡 Profile subscription status:", status);
      });

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [session?.user?.id, isClient]); // Removed refreshUserProfile from dependencies

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClientComponentClient();
    const channel = supabase
      .channel("profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          // Re-fetch profile and update context
          await loadUserProfile(user.id, user.email);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Session recovery mechanism
  const attemptSessionRecovery = useCallback(async () => {
    if (!isClient) return false;

    try {
      AuthDebug.log("🔄 Attempting session recovery...");

      const supabase = createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        AuthDebug.error("❌ Session recovery failed:", error);
        return false;
      }

      if (session) {
        AuthDebug.log("✅ Session recovered successfully");
        await handleAuthStateChange("SESSION_RECOVERED", session);
        return true;
      }

      return false;
    } catch (error) {
      AuthDebug.error("❌ Unexpected error during session recovery:", error);
      return false;
    }
  }, [isClient, handleAuthStateChange]);

  const signOut = async () => {
    try {
      AuthDebug.log("🚪 Signing out...");

      // Clear user state immediately
      setUser(null);
      setSession(null);

      // Then sign out from Supabase
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        AuthDebug.error("❌ Error signing out:", error);
        toast.error("Error signing out");
      } else {
        AuthDebug.log("✅ Successfully signed out");
        toast.success("Signed out successfully");
      }
    } catch (error) {
      AuthDebug.error("❌ Unexpected error during sign out:", error);
      toast.error("Unexpected error during sign out");
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshUserProfile,
    attemptSessionRecovery,
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
