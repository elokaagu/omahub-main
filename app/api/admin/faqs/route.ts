import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import {
  faqCreateSchema,
  faqUpdateSchema,
  faqPatchSchema,
  faqIdSchema,
  faqCategorySchema,
  faqPageLocationSchema,
} from "@/lib/validation/faqs";

export const dynamic = "force-dynamic";

/**
 * GET: RLS enforces active-only rows for anon; super_admin may list inactive via query flags.
 * See scripts/create-faq-management-system.sql — "Public read access to active FAQs".
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";
    const isActiveRaw = searchParams.get("is_active");

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isSuperAdmin = false;
    if (user?.id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isSuperAdmin = prof?.role === "super_admin";
    }

    const wantsUnpublished =
      includeInactive || isActiveRaw === "false";

    if (wantsUnpublished && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    const pageLocationRaw = searchParams.get("page_location");
    if (pageLocationRaw && pageLocationRaw !== "all") {
      const loc = faqPageLocationSchema.safeParse(pageLocationRaw);
      if (loc.success) {
        query = query.in("page_location", [loc.data, "all"]);
      }
    }

    const categoryRaw = searchParams.get("category");
    if (categoryRaw) {
      const cat = faqCategorySchema.safeParse(categoryRaw);
      if (cat.success) {
        query = query.eq("category", cat.data);
      }
    }

    if (wantsUnpublished && isSuperAdmin) {
      if (isActiveRaw !== null && isActiveRaw !== "") {
        query = query.eq("is_active", isActiveRaw === "true");
      }
    } else {
      query = query.eq("is_active", true);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error("[admin/faqs GET] query failed", { code: error.code });
      return NextResponse.json(
        { error: "Failed to fetch FAQs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faqs: faqs ?? [] });
  } catch {
    console.error("[admin/faqs GET] unexpected error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = faqCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: faq, error } = await auth.supabase
      .from("faqs")
      .insert({
        ...parsed.data,
        created_by: auth.userId,
        updated_by: auth.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/faqs POST] insert failed", { code: error.code });
      return NextResponse.json(
        { error: "Failed to create FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faq, message: "FAQ created successfully" });
  } catch {
    console.error("[admin/faqs POST] unexpected error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed =
      faqPatchSchema.safeParse(body).success
        ? faqPatchSchema.safeParse(body)
        : faqUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { id, question, answer, ...optional } = parsed.data;
    const patch: Record<string, unknown> = {
      updated_by: auth.userId,
    };
    if (question !== undefined) patch.question = question;
    if (answer !== undefined) patch.answer = answer;
    if (optional.category !== undefined) patch.category = optional.category;
    if (optional.display_order !== undefined) {
      patch.display_order = optional.display_order;
    }
    if (optional.page_location !== undefined) {
      patch.page_location = optional.page_location;
    }
    if (optional.is_active !== undefined) patch.is_active = optional.is_active;

    const { data: faq, error } = await auth.supabase
      .from("faqs")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/faqs PUT] update failed", { code: error.code });
      return NextResponse.json(
        { error: "Failed to update FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ faq, message: "FAQ updated successfully" });
  } catch {
    console.error("[admin/faqs PUT] unexpected error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const idRaw = new URL(request.url).searchParams.get("id");
    const idParsed = faqIdSchema.safeParse(idRaw);
    if (!idParsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from("faqs")
      .delete()
      .eq("id", idParsed.data);

    if (error) {
      console.error("[admin/faqs DELETE] failed", { code: error.code });
      return NextResponse.json(
        { error: "Failed to delete FAQ" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch {
    console.error("[admin/faqs DELETE] unexpected error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
