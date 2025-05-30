import { Session, User } from "@supabase/supabase-js";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

export const AuthDebug = {
  log: (message: string, data?: any) => {
    if (!DEBUG) return;
    console.log(`🔐 Auth: ${message}`, data ? data : "");
  },

  error: (message: string, error?: any) => {
    if (!DEBUG) return;
    console.error(`❌ Auth Error: ${message}`, error ? error : "");
  },

  session: (session: Session | null) => {
    if (!DEBUG) return;
    if (!session) {
      console.log("🔐 Session: null");
      return;
    }
    console.log("🔐 Session:", {
      user_id: session.user?.id,
      email: session.user?.email,
      role: session.user?.role,
      expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
      last_signed_in: session.user?.last_sign_in_at,
    });
  },

  user: (user: User | null) => {
    if (!DEBUG) return;
    if (!user) {
      console.log("🔐 User: null");
      return;
    }
    console.log("🔐 User:", {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
    });
  },

  state: (event: string, session: Session | null) => {
    if (!DEBUG) return;
    console.log("🔄 Auth State Change:", {
      event,
      timestamp: new Date().toISOString(),
      has_session: !!session,
      user_id: session?.user?.id,
    });
  },
};
