import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to create authenticated supabase client
function createAuthenticatedClient() {
  const cookieStore = cookies();

  return createServerClient(
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
}

// Helper function to verify super admin permissions
async function verifySuperAdminPermissions(request: NextRequest) {
  const supabase = createAuthenticatedClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated", status: 401 };
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "super_admin") {
    return { error: "Insufficient permissions", status: 403 };
  }

  return { user, profile };
}

// GET - Fetch all FAQs (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page_location = searchParams.get("page_location");
    const category = searchParams.get("category");
    const is_active = searchParams.get("is_active");
    const include_inactive = searchParams.get("include_inactive") === "true";

    let query = supabaseAdmin
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Apply filters
    if (page_location && page_location !== "all") {
      query = query.in("page_location", [page_location, "all"]);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    } else if (!include_inactive) {
      // By default, only show active FAQs for public access
      query = query.eq("is_active", true);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error("Error fetching FAQs:", error);
      return NextResponse.json(
        { error: "Failed to fetch FAQs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faqs: faqs || [] });
  } catch (error) {
    console.error("Error in FAQs GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ (super admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifySuperAdminPermissions(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      question,
      answer,
      category,
      display_order,
      page_location,
      is_active,
    } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const { data: faq, error } = await supabaseAdmin
      .from("faqs")
      .insert({
        question,
        answer,
        category: category || "general",
        display_order: display_order || 0,
        page_location: page_location || "general",
        is_active: is_active !== undefined ? is_active : true,
        created_by: authResult.user!.id,
        updated_by: authResult.user!.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating FAQ:", error);
      return NextResponse.json(
        { error: "Failed to create FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faq, message: "FAQ created successfully" });
  } catch (error) {
    console.error("Error in FAQs POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update FAQ (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifySuperAdminPermissions(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      id,
      question,
      answer,
      category,
      display_order,
      page_location,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      );
    }

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const { data: faq, error } = await supabaseAdmin
      .from("faqs")
      .update({
        question,
        answer,
        category,
        display_order,
        page_location,
        is_active,
        updated_by: authResult.user!.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating FAQ:", error);
      return NextResponse.json(
        { error: "Failed to update FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faq, message: "FAQ updated successfully" });
  } catch (error) {
    console.error("Error in FAQs PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifySuperAdminPermissions(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("faqs").delete().eq("id", id);

    if (error) {
      console.error("Error deleting FAQ:", error);
      return NextResponse.json(
        { error: "Failed to delete FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error in FAQs DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
