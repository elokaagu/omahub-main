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
  const [profileCache, setProfileCache] = useState<Record<string, User>>({});

  const loadUserWithProfile = async (
    userId: string,
    email: string | undefined
  ) => {
    try {
      // Check profile cache first
      if (profileCache[userId]) {
        console.log("📦 Using cached profile data");
        setUser(profileCache[userId]);
        return;
      }

      // Get additional profile data
      const profileData = await getProfile(userId);

      // Create a complete user object with auth and profile data
      const completeUser: User = {
        id: userId,
        email: email || "",
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
        avatar_url: profileData?.avatar_url || "",
        role: profileData?.role || "user",
      };

      // Update profile cache
      setProfileCache((prev) => ({
        ...prev,
        [userId]: completeUser,
      }));

      setUser(completeUser);
    } catch (err) {
      console.error("Error loading user profile:", err);
      // Still set basic user data if profile fetch fails
      setUser({
        id: userId,
        email: email || "",
      });
    }
  };

  // Function to manually refresh the user profile
  const refreshUserProfile = async () => {
    if (user?.id) {
      try {
        // Clear profile from cache
        setProfileCache((prev) => {
          const newCache = { ...prev };
          delete newCache[user.id];
          return newCache;
        });

        // Fetch fresh profile data
        await loadUserWithProfile(user.id, user.email);
        return true;
      } catch (err) {
        console.error("Error refreshing user profile:", err);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    // Check for current user on mount
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && mounted) {
          await loadUserWithProfile(currentUser.id, currentUser.email);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && mounted) {
          await loadUserWithProfile(session.user.id, session.user.email);
        } else if (mounted) {
          setUser(null);
        }
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Clear profile cache on sign out
      setProfileCache({});
    } catch (err) {
      setError(err as Error);
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
