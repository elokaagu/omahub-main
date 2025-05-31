"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../supabase";
import { User, getCurrentUser, getProfile } from "../services/authService";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadUserWithProfile = async (
    userId: string,
    email: string | undefined
  ) => {
    try {
      console.log("🔄 Starting loadUserWithProfile for user:", userId);

      // Get additional profile data
      const profileData = await getProfile(userId);
      console.log("✅ Loaded profile data:", profileData);

      if (!profileData) {
        console.warn("⚠️ No profile data found for user:", userId);
        setUser(null);
        return;
      }

      // Create a complete user object with auth and profile data
      const completeUser: User = {
        id: userId,
        email: email || "",
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        avatar_url: profileData.avatar_url || "",
        role: profileData.role || "user",
        owned_brands: profileData.owned_brands || [],
      };

      console.log("👤 Setting complete user with role:", completeUser.role);
      setUser(completeUser);
    } catch (err) {
      console.error("❌ Error loading user profile:", err);
      setError(err as Error);
      setUser(null);
    }
  };

  // Function to handle auth state changes
  const handleAuthChange = async (event: string, session: any) => {
    console.log("🔐 Auth state changed:", event, session?.user?.id);

    try {
      if (event === "SIGNED_OUT" || !session) {
        console.log("👋 User signed out or no session");
        setUser(null);
        setError(null);
      } else if (session?.user) {
        console.log("✅ User session found:", session.user.id);
        await loadUserWithProfile(session.user.id, session.user.email);
      }
    } catch (err) {
      console.error("❌ Error handling auth state change:", err);
      setError(err as Error);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log("🔍 Checking initial session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // Try to refresh the session first
          const { data: refreshedSession, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.warn("⚠️ Session refresh failed:", refreshError);
            // Continue with the existing session
            await handleAuthChange("INITIAL", session);
          } else {
            console.log("✅ Session refreshed successfully");
            await handleAuthChange("INITIAL", refreshedSession.session);
          }
        } else {
          await handleAuthChange("SIGNED_OUT", null);
        }
      } catch (err) {
        console.error("❌ Error checking initial session:", err);
        setError(err as Error);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !isInitialized) return;

      setLoading(true);
      await handleAuthChange(event, session);
      if (mounted) {
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("🔄 Signing out...");
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      console.log("✅ Sign out successful");
    } catch (err) {
      console.error("❌ Error signing out:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      try {
        console.log("🔄 Refreshing user profile for:", user.id);
        setLoading(true);

        // First clear current user data to prevent stale data persistence
        setUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            // Keep basic auth data but clear profile data that will be refreshed
            avatar_url: undefined,
            first_name: undefined,
            last_name: undefined,
          };
        });

        // Now fetch fresh profile data
        await loadUserWithProfile(user.id, user.email);
        return true;
      } catch (err) {
        console.error("❌ Error refreshing user profile:", err);
        return false;
      } finally {
        setLoading(false);
      }
    }
    return false;
  };

  const value = {
    user,
    loading,
    error,
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
