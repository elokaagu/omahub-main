import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasStudioAccess } from "@/lib/services/permissionsService.server";

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

    // Skip middleware for public API routes
    const publicApiRoutes = [
      "/api/test-airtable",
      "/api/test-airtable-submit",
      "/api/test-simple-submit",
      "/api/test-brand-name",
      "/api/check-airtable-fields",
      "/api/designer-application",
      "/api/contact",
    ];

    if (
      publicApiRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
    ) {
      console.log("⏭️ Skipping middleware for public API route");
      return NextResponse.next();
    }

    // Create a response and supabase client
    const res = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              });
            });
          },
        },
      }
    );

    // Initialize session variable
    let session = null;

    // Refresh session if expired - this will also handle refresh token issues
    try {
      const {
        data: { session: sessionData },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        // Only log non-refresh-token errors to reduce noise
        if (!error.message?.includes("refresh_token_not_found")) {
          console.log("Middleware: Session error:", error.message);
        }
        // Don't redirect on session errors, let the app handle it
      }

      if (sessionData) {
        console.log(
          "Middleware: Valid session found for user:",
          sessionData.user.email
        );
        session = sessionData;
      }
    } catch (error) {
      // Silently handle session exceptions to prevent middleware failures
      console.log("Middleware: Exception getting session (handled gracefully)");
    }

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

    return res;
  } catch (error) {
    console.error("❌ Middleware error:", error);
    return handleAuthError(req);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
