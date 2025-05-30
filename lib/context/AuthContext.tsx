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

  const loadUserWithProfile = async (
    userId: string,
    email: string | undefined
  ) => {
    try {
      console.log("🔄 Starting loadUserWithProfile for user:", userId);
      setLoading(true);

      // Get additional profile data
      const profileData = await getProfile(userId);
      console.log("✅ Loaded profile data:", profileData);

      if (!profileData) {
        console.warn("⚠️ No profile data found for user:", userId);
        setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh the user profile
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

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event, session?.user?.id);

      if (!mounted) return;
      setLoading(true);

      try {
        if (event === "SIGNED_OUT") {
          console.log("👋 User signed out");
          setUser(null);
          setError(null);
        } else if (session?.user) {
          console.log("✅ User session found:", session.user.id);
          await loadUserWithProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error("❌ Error handling auth state change:", err);
        setError(err as Error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log("🔍 Checking initial session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          console.log("✅ Initial session found:", session.user.id);
          await loadUserWithProfile(session.user.id, session.user.email);
        } else {
          console.log("ℹ️ No initial session found");
          setUser(null);
        }
      } catch (err) {
        console.error("❌ Error checking initial session:", err);
        setError(err as Error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

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
