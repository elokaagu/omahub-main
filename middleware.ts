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

  // Only protect /studio routes - let everything else pass through
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
    } = await supabase.auth.getSession();

    // If no session on protected route, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
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
