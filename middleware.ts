import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // Handle corrupted or invalid sessions
    if (error) {
      console.log("🔧 Session error in middleware:", error.message);

      // Clear corrupted cookies
      res.cookies.delete("sb-access-token");
      res.cookies.delete("sb-refresh-token");

      // If accessing protected routes, redirect to login
      if (req.nextUrl.pathname.startsWith("/studio")) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Protect studio routes
    if (req.nextUrl.pathname.startsWith("/studio")) {
      if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Check user role for admin routes
      if (req.nextUrl.pathname.startsWith("/studio/")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (
          !profile ||
          !["super_admin", "brand_admin"].includes(profile.role)
        ) {
          return NextResponse.redirect(new URL("/login", req.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error("🚨 Middleware error:", error);

    // Clear all Supabase cookies on error
    const response = NextResponse.next();
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    // Redirect to login for studio routes
    if (req.nextUrl.pathname.startsWith("/studio")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
