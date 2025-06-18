import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canManageSettings } from "@/lib/services/permissionsService.server";

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("type");
    const activeOnly = searchParams.get("active") !== "false";

    const supabase = createSupabaseClient();

    let query = supabase
      .from("legal_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching legal documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch legal documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has permission to manage legal documents
    const hasAccess = await canManageSettings(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { document_type, title, content, effective_date } = body;

    if (!document_type || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: document_type, title, content" },
        { status: 400 }
      );
    }

    if (!["terms_of_service", "privacy_policy"].includes(document_type)) {
      return NextResponse.json(
        {
          error:
            "Invalid document_type. Must be 'terms_of_service' or 'privacy_policy'",
        },
        { status: 400 }
      );
    }

    // Get the current version for this document type
    const { data: existingDocs, error: versionError } = await supabase
      .from("legal_documents")
      .select("version")
      .eq("document_type", document_type)
      .order("version", { ascending: false })
      .limit(1);

    if (versionError) {
      console.error("Error getting version:", versionError);
      return NextResponse.json(
        { error: "Failed to determine document version" },
        { status: 500 }
      );
    }

    const nextVersion =
      existingDocs && existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

    // Create new document
    const { data, error } = await supabase
      .from("legal_documents")
      .insert([
        {
          document_type,
          title,
          content,
          effective_date:
            effective_date || new Date().toISOString().split("T")[0],
          version: nextVersion,
          is_active: true,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating legal document:", error);
      return NextResponse.json(
        { error: "Failed to create legal document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Legal document created successfully",
      document: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has permission to manage legal documents
    const hasAccess = await canManageSettings(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, content, effective_date, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Update document
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (effective_date !== undefined)
      updateData.effective_date = effective_date;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("legal_documents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating legal document:", error);
      return NextResponse.json(
        { error: "Failed to update legal document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Legal document updated successfully",
      document: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
