import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes, and auth callback
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/lovable-uploads") ||
    request.nextUrl.pathname.startsWith("/public") ||
    request.nextUrl.pathname.includes(".") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(
      request.nextUrl.pathname
    )
  ) {
    return NextResponse.next();
  }

  // Skip password gate for the password gate page itself
  if (request.nextUrl.pathname === "/password-gate") {
    return NextResponse.next();
  }

  // Check platform_visibility from the database (Supabase)
  let isPublic = false;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_visibility")
      .single();
    if (!error && data?.value === "public") {
      isPublic = true;
    }
  } catch (err) {
    // If DB check fails, fallback to cookie for legacy support
    isPublic = request.cookies.get("omahub-public")?.value === "true";
  }

  // TEMPORARY: Bypass password gate for development
  // TODO: Remove this bypass when going to production
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isPublic && !isDevelopment) {
    // Check for password gate access
    const hasPasswordAccess =
      request.cookies.get("omahub-access")?.value === "granted";

    if (!hasPasswordAccess) {
      // Redirect to password gate with the current path as redirect parameter
      const passwordGateUrl = new URL("/password-gate", request.url);
      passwordGateUrl.searchParams.set(
        "redirect",
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(passwordGateUrl);
    }
  }

  // Only protect /studio routes with Supabase auth - let everything else pass through
  if (!request.nextUrl.pathname.startsWith("/studio")) {
    return NextResponse.next();
  }

  // Simple session check for protected routes only
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {}, // No-op for middleware
          remove() {}, // No-op for middleware
        },
      }
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // Handle corrupted sessions
    if (error) {
      console.log("🔧 Session error in middleware:", error.message);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If no session on protected route, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("🚨 Middleware error:", error);
    // On any error, redirect to login for protected routes
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - lovable-uploads (image directory)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|lovable-uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
