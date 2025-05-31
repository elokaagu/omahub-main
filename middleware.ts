import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { hasStudioAccess } from "@/lib/services/permissionsService";

// Helper function to handle auth errors
function handleAuthError(req: NextRequest) {
  console.log("⛔ Auth error - redirecting to login");
  return redirectToLogin(req);
}

// Helper function to redirect to login
function redirectToLogin(req: NextRequest) {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

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

    // If accessing studio and authenticated, check permissions
    if (isStudioRoute && session) {
      console.log("👤 Checking studio access for user:", session.user.id);

      try {
        const hasAccess = await hasStudioAccess(session.user.id);

        if (hasAccess) {
          console.log("✅ Studio access granted");
          return res;
        }

        console.log("⛔ Studio access denied - insufficient permissions");
        return NextResponse.redirect(new URL("/", req.url));
      } catch (error) {
        console.error("❌ Permission check error:", error);
        return handleAuthError(req);
      }
    }

    // For all other routes, refresh the session if it exists
    if (session) {
      await supabase.auth.refreshSession();
    }

    return res;
  } catch (error) {
    console.error("❌ Middleware error:", error);
    return handleAuthError(req);
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
