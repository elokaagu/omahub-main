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

// Default documents to return if table doesn't exist
const defaultDocuments = [
  {
    id: "default-terms",
    document_type: "terms_of_service",
    title: "Terms of Service",
    content: `<h2>1. Acceptance of Terms</h2>
<p>By accessing and using OmaHub, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

<h2>2. User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.</p>

<h2>3. Platform Rules</h2>
<p>Users must respect intellectual property rights, maintain professional conduct, and follow our community guidelines when using OmaHub.</p>

<h2>4. Content Ownership</h2>
<p>Users retain ownership of their content while granting OmaHub a license to display and promote the content on our platform.</p>

<h2>5. Modifications to Service</h2>
<p>We reserve the right to modify or discontinue our service at any time, with or without notice.</p>`,
    effective_date: "2025-01-01",
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-privacy",
    document_type: "privacy_policy",
    title: "Privacy Policy",
    content: `<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly to us, including when you create an account, update your profile, or communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience on OmaHub.</p>

<h2>3. Information Sharing</h2>
<p>We do not sell or rent your personal information to third parties. We may share your information with service providers who assist in our operations and with your consent.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at info@oma-hub.com</p>`,
    effective_date: "2025-01-01",
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

    // If table doesn't exist, return default documents
    if (error && error.code === "PGRST116") {
      console.log(
        "Legal documents table not found, returning default documents"
      );
      let filteredDocuments = defaultDocuments;

      if (documentType) {
        filteredDocuments = defaultDocuments.filter(
          (doc) => doc.document_type === documentType
        );
      }

      if (activeOnly) {
        filteredDocuments = filteredDocuments.filter((doc) => doc.is_active);
      }

      return NextResponse.json({
        documents: filteredDocuments,
        notice:
          "Using default documents. Please set up the legal_documents table in your database.",
      });
    }

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
