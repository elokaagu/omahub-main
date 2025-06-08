import { supabase } from "@/lib/supabase";
import { AuthDebug } from "./debug";

export class SessionPersistence {
  private static readonly SESSION_KEY = "omahub-session-state";
  private static readonly HEARTBEAT_KEY = "omahub-session-heartbeat";
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize session persistence across tabs
   */
  static initialize() {
    if (typeof window === "undefined") return;

    // Start heartbeat to keep session alive
    this.startHeartbeat();

    // Listen for storage changes from other tabs
    window.addEventListener("storage", this.handleStorageChange);

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Clean up on page unload
    window.addEventListener("beforeunload", this.cleanup);

    AuthDebug.log("🔄 Session persistence initialized");
  }

  /**
   * Clean up event listeners and intervals
   */
  static cleanup() {
    if (typeof window === "undefined") return;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    window.removeEventListener("storage", this.handleStorageChange);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
    window.removeEventListener("beforeunload", this.cleanup);

    AuthDebug.log("🧹 Session persistence cleaned up");
  }

  /**
   * Start heartbeat to keep session alive
   */
  private static startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    // Initial heartbeat
    this.updateHeartbeat();
  }

  /**
   * Update heartbeat timestamp
   */
  private static updateHeartbeat() {
    if (typeof window === "undefined") return;

    try {
      const timestamp = Date.now();
      localStorage.setItem(this.HEARTBEAT_KEY, timestamp.toString());
    } catch (error) {
      AuthDebug.error("❌ Failed to update heartbeat:", error);
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private static handleStorageChange = (event: StorageEvent) => {
    if (event.key === this.SESSION_KEY) {
      AuthDebug.log("🔄 Session state changed in another tab");

      // If session was cleared in another tab, refresh current session
      if (!event.newValue && supabase) {
        AuthDebug.log(
          "🔄 Session cleared in another tab, checking current session"
        );
        supabase.auth.getSession().then(({ data, error }) => {
          if (error || !data.session) {
            AuthDebug.log("🚪 No valid session found, user likely signed out");
            // Let the auth context handle the logout
          }
        });
      }
    }
  };

  /**
   * Handle page visibility changes
   */
  private static handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      AuthDebug.log("👁️ Tab became visible, refreshing session check");

      // Restart heartbeat when tab becomes visible
      this.startHeartbeat();

      // Check if session is still valid
      if (supabase) {
        supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            AuthDebug.error("❌ Session check failed:", error);
          } else if (data.session) {
            AuthDebug.log("✅ Session is still valid");
            this.saveSessionState(data.session);
          } else {
            AuthDebug.log("⚠️ No session found on tab focus");
          }
        });
      }
    } else {
      AuthDebug.log("👁️ Tab became hidden");
    }
  };

  /**
   * Save session state to localStorage
   */
  static saveSessionState(session: any) {
    if (typeof window === "undefined") return;

    try {
      const sessionData = {
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      AuthDebug.error("❌ Failed to save session state:", error);
    }
  }

  /**
   * Get saved session state from localStorage
   */
  static getSavedSessionState() {
    if (typeof window === "undefined") return null;

    try {
      const saved = localStorage.getItem(this.SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      AuthDebug.error("❌ Failed to get saved session state:", error);
      return null;
    }
  }

  /**
   * Clear saved session state
   */
  static clearSessionState() {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.HEARTBEAT_KEY);
    } catch (error) {
      AuthDebug.error("❌ Failed to clear session state:", error);
    }
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(session: any): boolean {
    if (!session?.expires_at) return true;

    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minute buffer

    return now >= expiresAt - buffer;
  }
}
