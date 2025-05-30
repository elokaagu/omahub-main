import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // Create a response and supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in middleware:", sessionError);
      return res;
    }

    // Check if the request is for a protected route
    const isStudioRoute = req.nextUrl.pathname.startsWith("/studio");
    const isStorageRequest =
      req.nextUrl.pathname.includes("/storage/v1/object");
    const isProtectedRoute = isStudioRoute || isStorageRequest;

    // If accessing a protected route and not authenticated, redirect to login
    if (isProtectedRoute && !session) {
      console.log("No session found for protected route, redirecting to login");
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If accessing studio and authenticated, check admin role
    if (isStudioRoute && session) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error in middleware:", userError);
        return NextResponse.redirect(new URL("/", req.url));
      }

      // Get user's profile to check role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        console.error("Profile error in middleware:", profileError);
        return NextResponse.redirect(new URL("/", req.url));
      }

      // Check if user has admin or super_admin role
      if (
        !profile ||
        (profile.role !== "admin" && profile.role !== "super_admin")
      ) {
        console.log("User does not have admin access:", profile?.role);
        return NextResponse.redirect(new URL("/", req.url));
      }

      console.log("Admin access granted for user:", user?.id);
    }

    // Set the session cookie
    const response = NextResponse.next({
      request: {
        headers: req.headers,
      },
    });

    // Set cookies on the response
    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth callback route
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback).*)",
    "/studio/:path*",
    "/api/:path*",
  ],
};
