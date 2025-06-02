import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasStudioAccess } from "@/lib/services/permissionsService.server";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware triggered for:", request.nextUrl.pathname);

  // Log cookies for debugging
  const authCookies: { name: string; value: string }[] = [];
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
      authCookies.push({
        name: cookie.name,
        value: cookie.value.substring(0, 20) + "...",
      });
    }
  });

  console.log("🍪 Auth cookies found:", authCookies.length, authCookies);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          if (name.includes("supabase") && value) {
            console.log(
              `🔍 Getting cookie ${name}: ${value.substring(0, 20)}...`
            );
          }
          return value;
        },
        set(name: string, value: string, options: any) {
          if (name.includes("supabase")) {
            console.log(
              `🔧 Setting cookie ${name}: ${value.substring(0, 20)}...`
            );
          }
          request.cookies.set({
            name,
            value,
            ...options,
          });
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
          if (name.includes("supabase")) {
            console.log(`🗑️ Removing cookie ${name}`);
          }
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
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

  try {
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
      console.log("❌ No session found for studio route");
      console.log("🔄 Redirecting to sign-in page");
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Access granted");
    return response;
  } catch (error) {
    console.error("❌ Middleware error:", error);
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
