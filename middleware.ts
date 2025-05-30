import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    console.log("🚀 Middleware triggered for:", req.nextUrl.pathname);

    // Create a response and supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return handleAuthError(req);
    }

    console.log("🔑 Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      expiresAt: session?.expires_at,
    });

    // Check if the request is for a protected route
    const isStudioRoute = req.nextUrl.pathname.startsWith("/studio");
    const isStorageRequest =
      req.nextUrl.pathname.includes("/storage/v1/object");
    const isProtectedRoute = isStudioRoute || isStorageRequest;

    // If accessing a protected route and not authenticated, redirect to login
    if (isProtectedRoute && !session) {
      console.log("⛔ Protected route access denied - no session");
      return redirectToLogin(req);
    }

    // If accessing studio and authenticated, check admin role
    if (isStudioRoute && session) {
      console.log("👤 Checking studio access for user:", session.user.id);

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("❌ Profile fetch error:", profileError);
          return handleAuthError(req);
        }

        console.log("👑 User role:", profile?.role);

        if (
          profile &&
          (profile.role === "admin" || profile.role === "super_admin")
        ) {
          console.log("✅ Studio access granted");

          // Set auth cookie for client-side access
          res.cookies.set({
            name: "sb-auth-token",
            value: session.access_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });

          return res;
        }

        console.log("⛔ Studio access denied - insufficient permissions");
        return NextResponse.redirect(new URL("/", req.url));
      } catch (error) {
        console.error("❌ Profile check error:", error);
        return handleAuthError(req);
      }
    }

    return res;
  } catch (error) {
    console.error("❌ Middleware error:", error);
    return handleAuthError(req);
  }
}

function handleAuthError(req: NextRequest) {
  // Clear any existing auth cookies
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete("sb-auth-token");
  return res;
}

function redirectToLogin(req: NextRequest) {
  const redirectUrl = new URL("/login", req.url);
  redirectUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    // Match studio routes exactly
    "/studio",
    "/studio/:path*",

    // Match storage routes
    "/storage/:path*",

    // Match API routes
    "/api/:path*",
  ],
};
