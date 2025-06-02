import { supabase } from "../supabase";

export class AuthDebugger {
  private static logs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error";
    message: string;
    data?: any;
  }> = [];

  static log(message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "info" as const,
      message,
      data,
    };
    this.logs.push(entry);
    console.log(`🔍 [AUTH DEBUG] ${message}`, data || "");
  }

  static warn(message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "warn" as const,
      message,
      data,
    };
    this.logs.push(entry);
    console.warn(`⚠️ [AUTH DEBUG] ${message}`, data || "");
  }

  static error(message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "error" as const,
      message,
      data,
    };
    this.logs.push(entry);
    console.error(`❌ [AUTH DEBUG] ${message}`, data || "");
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }

  static async diagnoseAuthState() {
    this.log("🔍 Starting comprehensive auth state diagnosis...");

    try {
      // Check Supabase client
      if (!supabase) {
        this.error("Supabase client is null");
        return false;
      }
      this.log("✅ Supabase client exists");

      // Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      this.log("Environment check", { hasUrl, hasKey });

      if (!hasUrl || !hasKey) {
        this.error("Missing environment variables");
        return false;
      }

      // Check current session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        this.error("Error getting session", sessionError);
      } else {
        this.log("Session check", {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          email: sessionData.session?.user?.email,
        });
      }

      // Check storage
      if (typeof window !== "undefined") {
        const localStorageKeys = Object.keys(localStorage).filter(
          (key) =>
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("sb-")
        );
        this.log("LocalStorage auth keys", localStorageKeys);

        const sessionStorageKeys = Object.keys(sessionStorage).filter(
          (key) =>
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("sb-")
        );
        this.log("SessionStorage auth keys", sessionStorageKeys);

        // Check for auth cookies
        const authCookies = document.cookie.split(";").filter((cookie) => {
          const name = cookie.split("=")[0].trim();
          return (
            name.includes("supabase") ||
            name.includes("auth") ||
            name.includes("sb-")
          );
        });
        this.log("Auth cookies", authCookies);
      }

      // Test database connection
      try {
        const { data, error } = await supabase
          .from("brands")
          .select("id")
          .limit(1);
        if (error) {
          this.error("Database connection test failed", error);
        } else {
          this.log("✅ Database connection successful");
        }
      } catch (dbError) {
        this.error("Database test exception", dbError);
      }

      return true;
    } catch (error) {
      this.error("Diagnosis failed", error);
      return false;
    }
  }

  static async testGoogleOAuth() {
    this.log("🔍 Testing Google OAuth configuration...");

    try {
      if (!supabase) {
        this.error("Supabase client not available for OAuth test");
        return false;
      }

      // Check if we can initiate OAuth (without actually doing it)
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "http://localhost:3000/auth/callback";

      this.log("OAuth test configuration", {
        redirectUrl,
        hasWindow: typeof window !== "undefined",
      });

      // Test if the OAuth method exists and is callable
      if (typeof supabase.auth.signInWithOAuth === "function") {
        this.log("✅ signInWithOAuth method is available");
      } else {
        this.error("signInWithOAuth method not available");
        return false;
      }

      return true;
    } catch (error) {
      this.error("Google OAuth test failed", error);
      return false;
    }
  }

  static detectTokenRefreshLoop() {
    if (typeof window === "undefined") return false;

    const now = Date.now();
    const key = "auth_debug_refresh_count";
    const countKey = "auth_debug_refresh_timestamps";

    // Get recent refresh attempts
    const timestamps = JSON.parse(localStorage.getItem(countKey) || "[]");
    const recentTimestamps = timestamps.filter(
      (ts: number) => now - ts < 30000
    ); // Last 30 seconds

    // Add current timestamp
    recentTimestamps.push(now);
    localStorage.setItem(countKey, JSON.stringify(recentTimestamps));

    if (recentTimestamps.length > 5) {
      this.error(
        `Token refresh loop detected! ${recentTimestamps.length} attempts in 30 seconds`
      );
      return true;
    }

    return false;
  }

  static async emergencyAuthReset() {
    this.warn("🚨 Performing emergency auth reset...");

    try {
      // Sign out from Supabase
      if (supabase) {
        await supabase.auth.signOut();
        this.log("✅ Signed out from Supabase");
      }

      // Clear all auth-related storage
      if (typeof window !== "undefined") {
        // Clear localStorage
        const localKeys = Object.keys(localStorage);
        localKeys.forEach((key) => {
          if (
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("sb-")
          ) {
            localStorage.removeItem(key);
            this.log(`🗑️ Removed localStorage: ${key}`);
          }
        });

        // Clear sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          if (
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("sb-")
          ) {
            sessionStorage.removeItem(key);
            this.log(`🗑️ Removed sessionStorage: ${key}`);
          }
        });

        // Clear cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (
            name.includes("supabase") ||
            name.includes("auth") ||
            name.includes("sb-")
          ) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            this.log(`🗑️ Removed cookie: ${name}`);
          }
        });

        // Clear debug data
        localStorage.removeItem("auth_debug_refresh_count");
        localStorage.removeItem("auth_debug_refresh_timestamps");
      }

      this.log("✅ Emergency auth reset completed");
      return true;
    } catch (error) {
      this.error("Emergency auth reset failed", error);
      return false;
    }
  }

  static exportDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      logs: this.logs,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "server",
        url: typeof window !== "undefined" ? window.location.href : "server",
      },
    };

    console.log("📋 Auth Diagnostics Export:", diagnostics);
    return diagnostics;
  }
}
