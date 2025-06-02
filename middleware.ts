import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasStudioAccess } from "@/lib/services/permissionsService.server";

function handleAuthError(req: NextRequest) {
  console.log("🔄 Redirecting to sign-in page");
  const redirectUrl = new URL("/auth/signin", req.url);
  redirectUrl.searchParams.set("redirect_to", req.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(req: NextRequest) {
  try {
    console.log("🚀 Middleware triggered for:", req.nextUrl.pathname);

    // Skip middleware for public API routes
    if (req.nextUrl.pathname.startsWith("/api/public")) {
      return NextResponse.next();
    }

    // Skip middleware for auth routes
    if (req.nextUrl.pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Create a response and supabase client
    const res = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            res.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

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
    if (req.nextUrl.pathname.startsWith("/studio")) {
      if (!session) {
        console.log("❌ No session found for studio route");
        return handleAuthError(req);
      }

      // Check studio access permissions
      const hasAccess = await hasStudioAccess(session.user.id);
      console.log("🔐 Studio access check:", { hasAccess });

      if (!hasAccess) {
        console.log("❌ User does not have studio access");
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      console.log("✅ Studio access granted");
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
