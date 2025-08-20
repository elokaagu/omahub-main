import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SUPER_ADMIN_EMAILS = [
  "eloka.agu@icloud.com",
  "shannonalisa@oma-hub.com",
  "nnamdiohaka@gmail.com",
];
const BRAND_ADMIN_EMAILS = ["eloka@culturin.com", "eloka.agu96@gmail.com"];

function getUserRole(email: string): string {
  if (SUPER_ADMIN_EMAILS.includes(email)) return "super_admin";
  if (BRAND_ADMIN_EMAILS.includes(email)) return "brand_admin";
  return "user";
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  console.log("🔐 Login attempt for:", email);

  if (!email || !password) {
    console.log("❌ Missing email or password");
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

  try {
    console.log("🔄 Attempting Supabase authentication...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Supabase auth error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      // Provide more specific error messages
      let errorMessage = error.message;

      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        errorMessage =
          "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        errorMessage =
          "Please check your email and click the confirmation link before signing in.";
      } else if (error.message?.toLowerCase().includes("too many requests")) {
        errorMessage =
          "Too many login attempts. Please wait a few minutes before trying again.";
      }

      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    console.log("✅ Supabase authentication successful for:", data.user.email);

    // Check if profile exists first to preserve owned_brands
    const userRole = getUserRole(data.user.email || "");

    console.log("🔄 Checking existing profile for:", data.user.email);

    // First, check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id, owned_brands, role")
      .eq("id", data.user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("❌ Error checking existing profile:", profileCheckError);
    }

    let profileData;
    if (existingProfile) {
      console.log(
        "✅ Existing profile found, preserving owned_brands:",
        existingProfile.owned_brands
      );

      // Profile exists - only update role and email, preserve owned_brands
      profileData = {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        owned_brands: existingProfile.owned_brands || [], // Preserve existing owned_brands
        updated_at: new Date().toISOString(),
      };
    } else {
      console.log("🆕 Creating new profile with default owned_brands");

      // New profile - set default owned_brands based on role
      let defaultOwnedBrands: string[] = [];

      // Set default brands for known brand admins
      if (
        userRole === "brand_admin" &&
        data.user.email === "eloka@culturin.com"
      ) {
        defaultOwnedBrands = ["ehbs-couture"];
      }

      profileData = {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        owned_brands: defaultOwnedBrands,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    console.log("🔄 Upserting profile with data:", {
      role: profileData.role,
      owned_brands: profileData.owned_brands,
      email: profileData.email,
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (profileError) {
      console.error("❌ Profile upsert error:", profileError);
      // Don't fail login if profile creation fails
    } else {
      console.log(
        "✅ Profile upserted successfully with preserved owned_brands"
      );
    }

    // Create response with session refresh instruction
    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      refreshSession: true, // Signal frontend to refresh session
    });

    // Set additional headers to help with session sync
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    console.log("✅ Login successful, returning response");
    return response;
  } catch (error) {
    console.error("❌ Unexpected login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
