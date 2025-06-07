import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasStudioAccess } from "@/lib/services/permissionsService.server";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware triggered for:", request.nextUrl.pathname);

  // Skip middleware for static files, API routes, and auth callback
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.includes(".")
  ) {
    console.log("⏭️ Skipping middleware for:", request.nextUrl.pathname);
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Set the cookie in the request for immediate use
            request.cookies.set({
              name,
              value,
              ...options,
            });
            // Set the cookie in the response for future requests
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            // Remove the cookie from the request
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            // Remove the cookie from the response
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired - this is important for OAuth flows
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("🔑 Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at,
      provider: session?.user?.app_metadata?.provider,
      sessionError: sessionError?.message,
    });

    // Protected routes that require authentication
    const protectedRoutes = ["/studio"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !session) {
      console.log("❌ No session found for protected route");
      console.log("🔄 Redirecting to sign-in page");
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If we have a session, ensure it's properly set in cookies
    if (session) {
      console.log("✅ Valid session found, ensuring cookies are set");

      // Refresh the session to ensure it's valid and update cookies
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.log("⚠️ Session refresh failed:", refreshError.message);
        // If refresh fails and we're on a protected route, redirect to login
        if (isProtectedRoute) {
          const redirectUrl = new URL("/login", request.url);
          redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } else if (refreshedSession) {
        console.log("✅ Session refreshed successfully");
      }
    }

    console.log("✅ Access granted");
    return response;
  } catch (error) {
    console.error("❌ Middleware error:", error);

    // For protected routes, redirect to login on error
    const protectedRoutes = ["/studio"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      console.log("🔄 Redirecting to login due to middleware error");
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Access granted (fallback due to error)");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
