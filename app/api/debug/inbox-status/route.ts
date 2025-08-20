import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  try {
    // 1. Check Supabase client creation
    debug.checks.supabaseClient = "attempting...";
    const supabase = await createServerSupabaseClient();
    debug.checks.supabaseClient = "✅ created successfully";

    // 2. Check authentication
    debug.checks.authentication = "checking...";
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      debug.checks.authentication = `❌ session error: ${sessionError.message}`;
    } else if (!session?.user) {
      debug.checks.authentication = "❌ no session or user";
    } else {
      debug.checks.authentication = `✅ authenticated as ${session.user.email}`;
      debug.user = {
        id: session.user.id,
        email: session.user.email,
      };

      // 3. Check user profile
      debug.checks.profile = "checking...";
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, owned_brands")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        debug.checks.profile = `❌ profile error: ${profileError.message}`;

        // Fallback: Check if user email indicates super_admin access (legacy support)
        const legacySuperAdmins = [
          "eloka.agu@icloud.com",
          "shannonalisa@oma-hub.com",
        ];
        
        if (legacySuperAdmins.includes(session.user.email || "")) {
          debug.checks.profile += " (super admin fallback available)";
          debug.profile = { role: "super_admin", owned_brands: [] };
        }
      } else {
        debug.checks.profile = "✅ profile found";
        debug.profile = profile;
      }
    }

    // 4. Check database tables
    debug.checks.tables = {};

    // Check inquiries table
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id")
        .limit(1);

      if (error) {
        debug.checks.tables.inquiries = `❌ error: ${error.message}`;
      } else {
        debug.checks.tables.inquiries = "✅ accessible";
      }
    } catch (error) {
      debug.checks.tables.inquiries = `❌ exception: ${error}`;
    }

    // Check inquiry_replies table
    try {
      const { data, error } = await supabase
        .from("inquiry_replies")
        .select("id")
        .limit(1);

      if (error) {
        debug.checks.tables.inquiry_replies = `❌ error: ${error.message}`;
      } else {
        debug.checks.tables.inquiry_replies = "✅ accessible";
      }
    } catch (error) {
      debug.checks.tables.inquiry_replies = `❌ exception: ${error}`;
    }

    // Check inquiries_with_details view
    try {
      const { data, error } = await supabase
        .from("inquiries_with_details")
        .select("id")
        .limit(1);

      if (error) {
        debug.checks.tables.inquiries_with_details = `❌ error: ${error.message}`;
      } else {
        debug.checks.tables.inquiries_with_details = "✅ accessible";
      }
    } catch (error) {
      debug.checks.tables.inquiries_with_details = `❌ exception: ${error}`;
    }

    // 5. Environment variables check
    debug.checks.environment = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "✅ set"
        : "❌ missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "✅ set"
        : "❌ missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "✅ set"
        : "❌ missing",
    };

    debug.checks.overall = "✅ debug completed";

    return NextResponse.json(debug, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    debug.checks.overall = `❌ critical error: ${error}`;
    debug.error = error instanceof Error ? error.message : String(error);

    return NextResponse.json(debug, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
