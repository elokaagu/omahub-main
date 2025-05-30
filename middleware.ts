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
    } = await supabase.auth.getSession();

    console.log("🔑 Session check:", session ? "Session found" : "No session");

    // Check if the request is for a protected route
    const isStudioRoute = req.nextUrl.pathname.startsWith("/studio");
    const isStorageRequest =
      req.nextUrl.pathname.includes("/storage/v1/object");
    const isProtectedRoute = isStudioRoute || isStorageRequest;

    // If accessing a protected route and not authenticated, redirect to login
    if (isProtectedRoute && !session) {
      console.log("⛔ Protected route access denied - no session");
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If accessing studio and authenticated, check admin role
    if (isStudioRoute && session) {
      console.log("👤 Checking studio access for user:", session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      console.log("👑 User role:", profile?.role);

      if (
        profile &&
        (profile.role === "admin" || profile.role === "super_admin")
      ) {
        console.log("✅ Studio access granted");
        return res;
      }

      console.log("⛔ Studio access denied - insufficient permissions");
      return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
  } catch (error) {
    console.error("❌ Middleware error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
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
