import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoint only available in development" },
      { status: 403 }
    );
  }

  try {
    const cookieStore = cookies();

    // Create server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get all cookies
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(
      (cookie) =>
        cookie.name.includes("supabase") || cookie.name.includes("auth")
    );

    // Test session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Test OAuth URL generation
    const { data: oauthData, error: oauthError } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${request.nextUrl.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "email profile",
        },
      });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map((c) => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
        })),
      },
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        error: sessionError?.message,
      },
      oauth: {
        url: oauthData?.url,
        provider: oauthData?.provider,
        error: oauthError?.message,
        expectedRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
      correctRedirectUris: {
        development: [
          `http://localhost:3000/auth/callback`,
          `http://localhost:54321/auth/v1/callback`,
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        ],
        production: [
          `https://omahub-main.vercel.app/auth/callback`,
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
