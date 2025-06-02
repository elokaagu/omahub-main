import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development" },
      { status: 403 }
    );
  }

  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "✅ Set"
          : "❌ Missing",
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      oauth: {
        redirectUrls: {
          production: "https://omahub-main.vercel.app/auth/callback",
          development: "http://localhost:3000/auth/callback",
          supabase: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        },
      },
    };

    // Test Supabase connection
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Test basic connectivity
        const { data, error } = await supabase.auth.getSession();
        debugInfo.supabase.connectivity = error
          ? `❌ Error: ${error.message}`
          : "✅ Connected";
      } catch (err) {
        debugInfo.supabase.connectivity = `❌ Exception: ${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
