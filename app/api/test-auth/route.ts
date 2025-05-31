import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Test database connection
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: error.message,
          status: "error",
        },
        { status: 500 }
      );
    }

    // Test auth session
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    return NextResponse.json({
      status: "success",
      message: "Authentication system is working",
      data: {
        supabaseConnected: true,
        databaseConnected: true,
        profileCount: count || 0,
        hasActiveSession: !!session,
        sessionUser: session?.user?.email || null,
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          nodeEnv: process.env.NODE_ENV,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}
