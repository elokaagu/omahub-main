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
    // Check for current user on mount
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          await loadUserWithProfile(currentUser.id, currentUser.email);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err as Error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserWithProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
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
