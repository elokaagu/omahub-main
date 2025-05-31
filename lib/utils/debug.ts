import { Session, User } from "@supabase/supabase-js";

const isDevelopment = process.env.NODE_ENV === "development";

export const AuthDebug = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  state: (event: string, session: any) => {
    if (isDevelopment) {
      console.log(`🔄 Auth State Change: ${event}`, {
        timestamp: new Date().toISOString(),
        hasSession: !!session,
        userId: session?.user?.id,
      });
    }
  },
  session: (session: any) => {
    if (isDevelopment) {
      console.log("📊 Session:", {
        userId: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.user_metadata?.role,
        expiresAt: session?.expires_at,
        lastSignedIn: session?.user?.last_sign_in_at,
      });
    }
  },
  user: (user: User | null) => {
    if (isDevelopment) {
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
    }
  },
};
