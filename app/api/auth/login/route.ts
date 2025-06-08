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
    console.log("🔐 Attempting email/password login for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Login failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      console.error("❌ No session created");
      return NextResponse.json(
        { error: "No session created" },
        { status: 401 }
      );
    }

    console.log("✅ Login successful for:", data.user.email);

    // Check if profile exists, create if not
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      console.log("🔄 Creating user profile");
      // Profile doesn't exist, create it
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
      } else {
        console.log("✅ Profile created successfully");
      }
    } else if (profile) {
      console.log("✅ Profile already exists");
    } else if (profileError) {
      console.error("❌ Profile check error:", profileError);
    }

    // Update the response with success data
    return NextResponse.json(
      {
        success: true,
        user: data.user,
        session: data.session,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
