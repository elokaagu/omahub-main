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

    // Check if the request is for a Supabase storage image
    const isStorageRequest =
      req.nextUrl.pathname.includes("/storage/v1/object");

    // If accessing storage or protected route and not logged in, redirect to login
    const isProtectedRoute =
      req.nextUrl.pathname.startsWith("/studio") || isStorageRequest;

    if (isProtectedRoute && !session) {
      // For image requests, return a 401 status
      if (isStorageRequest) {
        return new NextResponse(null, { status: 401 });
      }

      // For other protected routes, redirect to login
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
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
    console.error("Error in middleware:", error);
    // Return the original response if there's an error
    return NextResponse.next();
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
