import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CookieOptions } from "@supabase/ssr";

// Define Supabase URL and key to make sure they're available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase environment variables are not set correctly in middleware"
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      supabaseUrl || "",
      supabaseAnonKey || "",
      {
        cookies: {
          get: (name: string) => {
            return req.cookies.get(name)?.value;
          },
          set: (name: string, value: string, options: CookieOptions) => {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove: (name: string, options: CookieOptions) => {
            res.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired
    await supabase.auth.getSession();
  } catch (error) {
    console.error("Error in middleware:", error);
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except for static files, api routes, and authentication routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
