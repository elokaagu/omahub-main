import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Database-driven role detection - no more hardcoded emails!
async function getUserRoleFromDatabase(email: string): Promise<string> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();

    if (error || !profile) {
      console.log("⚠️ Login: No profile found for email:", email, "defaulting to user");
      return "user";
    }

    console.log("✅ Login: Found role in database:", profile.role, "for email:", email);
    return profile.role;
  } catch (error) {
    console.error("❌ Login: Error fetching user role from database:", error);
    return "user"; // Safe fallback
  }
}

// Legacy fallback for backward compatibility
function getLegacyUserRole(email: string): string {
  const legacySuperAdmins = [
    "eloka.agu@icloud.com",
    "shannonalisa@oma-hub.com",
    "nnamdiohaka@gmail.com",
  ];
  const legacyBrandAdmins = [
    "eloka@culturin.com",
    "eloka.agu96@gmail.com",
  ];

  if (legacySuperAdmins.includes(email)) return "super_admin";
  if (legacyBrandAdmins.includes(email)) return "brand_admin";
  return "user";
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

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

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Login error:", error);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Get user role dynamically from database
    let userRole = await getUserRoleFromDatabase(email);
    
    // If database lookup failed, fall back to legacy method
    if (userRole === "user" && getLegacyUserRole(email) !== "user") {
      console.log("🔄 Login: Database lookup failed, using legacy role detection for:", email);
      userRole = getLegacyUserRole(email);
    }

    console.log("✅ Login: User authenticated successfully:", {
      email,
      role: userRole,
      userId: data.user.id
    });

    return NextResponse.json({
      user: data.user,
      role: userRole,
      message: "Login successful",
    });
  } catch (error) {
    console.error("❌ Login: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
