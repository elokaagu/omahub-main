import { NextRequest, NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import {
  handleDeleteLead,
  handleLeadsAnalyticsGET,
  handleLeadsListGET,
  handlePostLead,
  handlePutLead,
} from "@/lib/services/adminLeadsHttpHandlers";

export type { Booking, Lead, LeadsAnalytics } from "@/lib/types/admin-leads";

export const dynamic = "force-dynamic";

/**
 * Leads only. Prefer:
 * - GET /api/admin/leads/analytics for analytics
 * - /api/admin/bookings, /api/admin/lead-interactions, /api/admin/commission-structure for other resources.
 * Legacy: GET ?action=analytics still works and delegates to the same handler as /analytics.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    if (new URL(request.url).searchParams.get("action") === "analytics") {
      return handleLeadsAnalyticsGET(auth.ctx);
    }

    return await handleLeadsListGET(request, auth.ctx);
  } catch (error) {
    console.error("Admin leads GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    /** @deprecated Prefer POST /api/admin/leads with flat lead body (no `type` wrapper). */
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "lead"
    ) {
      return handlePostLead((body as unknown as { data: unknown }).data, auth.ctx);
    }

    /** @deprecated Prefer POST /api/admin/bookings | /api/admin/lead-interactions. */
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "booking"
    ) {
      const { handlePostBooking } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      return handlePostBooking(
        (body as unknown as { data: unknown }).data,
        auth.ctx
      );
    }
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "interaction"
    ) {
      const { handlePostInteraction } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      return handlePostInteraction(
        (body as unknown as { data: unknown }).data,
        auth.ctx
      );
    }

    return await handlePostLead(body, auth.ctx);
  } catch (error) {
    console.error("Admin leads POST error:", error);
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

    /** @deprecated Prefer PUT /api/admin/leads with `{ id, data }` (no `type`). */
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "lead"
    ) {
      const b = body as unknown as { id: string; data: unknown };
      return handlePutLead({ id: b.id, data: b.data }, auth.ctx);
    }

    /** @deprecated Prefer PUT /api/admin/bookings or /api/admin/commission-structure. */
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "booking"
    ) {
      const { handlePutBooking } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      const b = body as unknown as { id: string; data: unknown };
      return handlePutBooking({ id: b.id, data: b.data }, auth.ctx);
    }
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      (body as { type?: string }).type === "commission_structure"
    ) {
      const { handlePutCommissionStructure } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      const b = body as unknown as { id: string; data: unknown };
      return handlePutCommissionStructure(
        { id: b.id, data: b.data },
        auth.ctx
      );
    }

    return await handlePutLead(body, auth.ctx);
  } catch (error) {
    console.error("Admin leads PUT error:", error);
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

    const params = new URL(request.url).searchParams;
    const type = params.get("type");

    /** @deprecated Prefer DELETE /api/admin/bookings?id= or /api/admin/lead-interactions?id=. */
    if (type === "booking") {
      const { handleDeleteBooking } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      return handleDeleteBooking(params, auth.ctx);
    }
    if (type === "interaction") {
      const { handleDeleteInteraction } = await import(
        "@/lib/services/adminLeadsHttpHandlers"
      );
      return handleDeleteInteraction(params, auth.ctx);
    }

    return await handleDeleteLead(params, auth.ctx);
  } catch (error) {
    console.error("Admin leads DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
