"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-unified";
import { getProfile, User } from "@/lib/services/authService";
import { AuthDebug } from "@/lib/utils/debug";
import { toast } from "sonner";

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
      supabase.auth
        .refreshSession()
        .then(({ data, error }: { data: { session: Session | null }; error: AuthError | null }) => {
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
    const PROFILE_TIMEOUT_MS = 4000;
    const MAX_ATTEMPTS = 2;

    const loadOnce = async (): Promise<User | null> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Profile loading timeout")),
          PROFILE_TIMEOUT_MS
        );
      });
      return (await Promise.race([
        getProfile(userId),
        timeoutPromise,
      ])) as User | null;
    };

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        AuthDebug.log(
          `🔄 Loading user profile for: ${userId} (attempt ${attempt}/${MAX_ATTEMPTS})`
        );
        const profile = await loadOnce();

        if (profile) {
          setUser(profile);
          AuthDebug.log("✅ User profile loaded:", profile.email);
          return;
        }

        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
          continue;
        }

        const userEmail = email || "";
        const basicUser: User = {
          id: userId,
          email: userEmail,
          first_name: "",
          last_name: "",
          avatar_url: "",
          role: "user",
          owned_brands: [],
        };
        setUser(basicUser);
        AuthDebug.log(
          "⚠️ No profile found after retries; using basic user (role user) until profile exists:",
          userEmail
        );
        return;
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof Error &&
          (error.message === "Profile loading timeout" ||
            error.message.includes("network") ||
            error.message.includes("timeout"));

        if (retryable && attempt < MAX_ATTEMPTS) {
          AuthDebug.log(
            `⚠️ Profile load attempt ${attempt} failed, retrying...`,
            error
          );
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }

        AuthDebug.error("❌ Error loading user profile:", error);
        if (retryable) {
          const userEmail = email || "";
          const basicUser: User = {
            id: userId,
            email: userEmail,
            first_name: "",
            last_name: "",
            avatar_url: "",
            role: "user",
            owned_brands: [],
          };
          setUser(basicUser);
          AuthDebug.log(
            "⚠️ Profile loading failed after retries; using basic user (role user):",
            userEmail
          );
          return;
        }

        AuthDebug.log("❌ Authentication error, setting user to null");
        setUser(null);
        return;
      }
    }

    AuthDebug.error("❌ Unexpected profile load exit", lastError);
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
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
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
    }
    );

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
    const supabase = createClient();
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
        async (_payload: unknown) => {
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
