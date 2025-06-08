import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("🧪 Test session API called");

  const cookieStore = cookies();
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

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    const response = {
      hasSession: !!session,
      sessionError: error?.message || null,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      expiresAt: session?.expires_at || null,
      provider: session?.user?.app_metadata?.provider || null,
      cookies: {
        count: cookieStore.getAll().length,
        authCookies: cookieStore
          .getAll()
          .filter(
            (cookie) =>
              cookie.name.includes("supabase") || cookie.name.includes("auth")
          )
          .map((cookie) => ({
            name: cookie.name,
            hasValue: !!cookie.value,
            valueLength: cookie.value?.length || 0,
          })),
      },
      timestamp: new Date().toISOString(),
    };

    console.log("🧪 Test session response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Test session error:", error);
    return NextResponse.json(
      {
        error: "Failed to check session",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
