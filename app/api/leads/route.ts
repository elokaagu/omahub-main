import { NextRequest, NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { getAdminClient } from "@/lib/supabase-admin";
import {
  checkPublicLeadRateLimit,
  getPublicLeadRateLimitClientKey,
} from "@/lib/rate-limit/publicLeadRateLimit";
import {
  isPublicLeadHoneypotTriggered,
  publicLeadPostBodySchema,
  stripPublicLeadHoneypotFields,
} from "@/lib/validation/publicLeadPostBody";
import { sendNewLeadNotificationToBrand } from "@/lib/services/emailService";
import {
  handleDeleteLead,
  handleLeadsAnalyticsGET,
  handleLeadsCommissionGET,
  handleLeadsListGET,
  handlePostLead,
  handlePutLead,
} from "@/lib/services/adminLeadsHttpHandlers";

export const dynamic = "force-dynamic";

/**
 * Public: POST (anonymous lead capture) — rate limit, honeypot, validation, direct email.
 * Authenticated studio: POST/GET/PUT/DELETE delegate to the same handlers as /api/admin/leads
 * so permissions and validation stay in one place.
 *
 * Prefer new paths: /api/admin/leads, /api/admin/leads/analytics, /api/admin/leads/commission.
 */

function normalizeLegacyPutBody(
  body: unknown
): { id: string; data: Record<string, unknown> } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.leadId === "string" && typeof b.newStatus === "string") {
    return { id: b.leadId, data: { status: b.newStatus } };
  }
  if (
    typeof b.id === "string" &&
    b.data &&
    typeof b.data === "object" &&
    !Array.isArray(b.data)
  ) {
    return { id: b.id, data: b.data as Record<string, unknown> };
  }
  if (typeof b.id === "string") {
    const { id, ...rest } = b;
    if (Object.keys(rest).length === 0) return null;
    return { id, data: rest as Record<string, unknown> };
  }
  return null;
}

async function legacyListGET(
  request: NextRequest,
  ctx: Parameters<typeof handleLeadsListGET>[1]
) {
  const res = await handleLeadsListGET(request, ctx);
  if (!res.ok) return res;

  const data = (await res.json()) as {
    leads?: unknown[];
    totalCount?: number;
    totalPages?: number;
    currentPage?: number;
  };

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10) || 50)
  );

  return NextResponse.json({
    success: true,
    leads: data.leads ?? [],
    total: data.totalCount ?? 0,
    pagination: {
      page: data.currentPage ?? 1,
      limit,
      total: data.totalCount ?? 0,
      totalPages: data.totalPages ?? 0,
    },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const auth = await requireLeadsAdmin();
    if (auth.ok) {
      return handlePostLead(body, auth.ctx);
    }
    // Invalid session or missing profile — stop. Wrong role (403) — allow public capture (e.g. shopper on brand page).
    if (auth.response.status === 401 || auth.response.status === 404) {
      return auth.response;
    }
  }

  if (isPublicLeadHoneypotTriggered(body)) {
    return NextResponse.json({ success: true });
  }

  if (!checkPublicLeadRateLimit(getPublicLeadRateLimitClientKey(request))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const stripped = stripPublicLeadHoneypotFields(body);
  const parsed = publicLeadPostBodySchema.safeParse(stripped);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or incomplete submission" },
      { status: 400 }
    );
  }

  const p = parsed.data;

  try {
    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Service temporarily unavailable." },
        { status: 503 }
      );
    }

    const { data: brand, error: brandError } = await admin
      .from("brands")
      .select("id, name, contact_email")
      .eq("id", p.brandId)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "We could not process this request. Please verify the brand and try again." },
        { status: 400 }
      );
    }

    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({
        brand_id: p.brandId,
        customer_name: p.name,
        contact_email: p.email,
        contact_phone: p.phone ?? null,
        source: p.source,
        lead_type: p.leadType,
        notes: p.notes ?? null,
        estimated_value: p.estimatedValue ?? null,
        priority: p.priority,
        status: "new",
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error("Public lead insert error:", leadError?.code, leadError?.message);
      return NextResponse.json(
        { error: "Unable to save your request. Please try again later." },
        { status: 500 }
      );
    }

    if (brand.contact_email) {
      void sendNewLeadNotificationToBrand({
        to: brand.contact_email,
        brandName: brand.name ?? "Your brand",
        customerName: p.name,
        customerEmail: p.email,
        source: p.source,
        leadType: p.leadType,
        notes: p.notes,
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (e) {
    console.error("Public lead POST failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Unable to complete your request." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const action = new URL(request.url).searchParams.get("action") || "list";

    if (action === "analytics") {
      return handleLeadsAnalyticsGET(auth.ctx);
    }
    if (action === "commission") {
      return handleLeadsCommissionGET(auth.ctx);
    }

    return legacyListGET(request, auth.ctx);
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const normalized = normalizeLegacyPutBody(body);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    return handlePutLead(normalized, auth.ctx);
  } catch (error) {
    console.error("PUT /api/leads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id && request.headers.get("content-type")?.includes("application/json")) {
      try {
        const b = (await request.json()) as { id?: string };
        if (typeof b?.id === "string") id = b.id;
      } catch {
        /* ignore */
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ id });
    const res = await handleDeleteLead(params, auth.ctx);

    if (!res.ok) return res;

    const data = (await res.json()) as { message?: string };
    return NextResponse.json({
      success: true,
      message: data.message ?? "Lead deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/leads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
