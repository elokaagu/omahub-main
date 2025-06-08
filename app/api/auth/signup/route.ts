import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          } catch (error) {
            console.error(`❌ Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
            response.cookies.set({ name, value: "", ...options });
          } catch (error) {
            console.error(`❌ Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );

  try {
    console.log("🔐 Attempting email/password signup for:", email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("❌ Signup failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      console.error("❌ No user created");
      return NextResponse.json({ error: "No user created" }, { status: 400 });
    }

    console.log("✅ Signup successful for:", data.user.email);

    // Create user profile
    if (data.user.id) {
      console.log("🔄 Creating user profile");
      const { error: createError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        role: "user",
        owned_brands: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("❌ Profile creation failed:", createError);
        // Don't fail the signup if profile creation fails
      } else {
        console.log("✅ Profile created successfully");
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        user: data.user,
        session: data.session,
        message: data.session
          ? "Account created and logged in successfully"
          : "Account created successfully. Please check your email for confirmation.",
      },
      {
        status: 201,
        headers: response.headers,
      }
    );
  } catch (error) {
    console.error("❌ Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
