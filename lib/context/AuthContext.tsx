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
      console.log("Starting loadUserWithProfile for user:", userId);
      // Get additional profile data
      const profileData = await getProfile(userId);
      console.log("Loaded profile data:", profileData);

      if (!profileData) {
        console.warn("No profile data found for user:", userId);
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

      console.log("Setting complete user with role:", completeUser.role);
      setUser(completeUser);
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err as Error);
    }
  };

  // Function to manually refresh the user profile
  const refreshUserProfile = async () => {
    if (user?.id) {
      try {
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

        // Add a small delay to ensure UI updates before fetching new data
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Now fetch fresh profile data
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      setLoading(true);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setError(null);
      } else if (session?.user) {
        await loadUserWithProfile(session.user.id, session.user.email);
      }

      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
      if (session?.user) {
        await loadUserWithProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Error signing out:", err);
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
