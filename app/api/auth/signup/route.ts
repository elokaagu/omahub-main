import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Function to trigger new account notification
async function triggerNewAccountNotification(user: any) {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhooks/new-account`;
    const webhookSecret = process.env.WEBHOOK_SECRET || "your-webhook-secret";

    const payload = {
      type: "INSERT",
      table: "profiles",
      record: {
        id: user.id,
        email: user.email,
        role: "user",
        created_at: new Date().toISOString(),
      },
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ New account notification triggered successfully");
    } else {
      console.error(
        "❌ Failed to trigger new account notification:",
        response.status
      );
    }
  } catch (error) {
    console.error("❌ Error triggering new account notification:", error);
    // Don't fail signup if notification fails
  }
}

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

    // Create user profile explicitly as a fallback
    // The database trigger should handle this, but we'll ensure it exists
    let profileCreated = false;
    try {
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profileCheckError && profileCheckError.code === "PGRST116") {
        // Profile doesn't exist, create it
        console.log("🔧 Creating profile for new user:", data.user.email);

        const { error: profileCreateError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: "user",
            owned_brands: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileCreateError) {
          console.error("❌ Profile creation error:", profileCreateError);
          // Don't fail the signup if profile creation fails
          // The user can still be authenticated
        } else {
          console.log("✅ Profile created successfully");
          profileCreated = true;
        }
      } else if (profileCheckError) {
        console.error("❌ Profile check error:", profileCheckError);
      } else {
        console.log("✅ Profile already exists (created by trigger)");
        profileCreated = true;
      }
    } catch (profileError) {
      console.error("❌ Profile handling error:", profileError);
      // Don't fail the signup process
    }

    // Trigger new account notification
    if (profileCreated || data.user) {
      console.log("🔔 Triggering new account notification...");
      await triggerNewAccountNotification(data.user);
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
