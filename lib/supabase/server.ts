import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createClient(request: NextRequest) {
  // Create a response object to handle cookies
  const response = NextResponse.next();

  console.log("🏗️ Creating server Supabase client with enhanced PKCE support");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Ensure PKCE flow is used for OAuth - same as browser client
        flowType: "pkce",
        // Enable session detection from URL for server-side OAuth handling
        detectSessionInUrl: true,
        // Persist session in cookies for server-side
        persistSession: true,
        // Auto refresh tokens
        autoRefreshToken: true,
        // Storage key for session - same as browser client
        storageKey: "sb-auth-token",
        // Debug mode for development
        debug: process.env.NODE_ENV === "development",
      },
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          console.log("🍪 Server client getting cookies:", {
            count: cookies.length,
            supabaseCookies: cookies.filter((c) => c.name.startsWith("sb-"))
              .length,
          });
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log("🍪 Server client setting cookies:", {
            count: cookiesToSet.length,
            cookieNames: cookiesToSet.map((c) => c.name),
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          });
        },
      },
      global: {
        headers: {
          "X-Client-Info": "omahub-server",
        },
      },
    }
  );

  console.log("✅ Server Supabase client created successfully");
  return { supabase, response };
}
