import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { parseContactPostBody } from "@/lib/validation/contactPostBody";
import {
  checkContactRateLimit,
  getContactRateLimitClientKey,
} from "@/lib/rate-limit/contactRateLimit";
import {
  ContactSubmissionError,
  submitBrandContact,
  submitGeneralContact,
} from "@/lib/services/contactSubmissionService";

function isHoneypotTriggered(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const hp = (raw as Record<string, unknown>)["_contact_hp"];
  return typeof hp === "string" && hp.trim().length > 0;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isHoneypotTriggered(raw)) {
    console.error(
      JSON.stringify({
        event: "contact_honeypot_triggered",
        path: "/api/contact",
      })
    );
    return NextResponse.json({
      success: true,
      message: "Thank you for your message.",
      type: "ack",
    });
  }

  if (!checkContactRateLimit(getContactRateLimitClientKey(request))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const parsed = parseContactPostBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    console.error(JSON.stringify({ event: "contact_admin_client_unavailable" }));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  try {
    if (parsed.kind === "brand") {
      const result = await submitBrandContact(supabase, parsed.data);
      const res = NextResponse.json({
        success: true,
        message: result.message,
        type: "brand_contact",
        inquiryId: result.inquiryId,
        leadSaved: result.leadSaved,
        notificationSent: result.notificationSent,
      });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const result = await submitGeneralContact(supabase, parsed.data);
    const res = NextResponse.json({
      success: true,
      message: result.message,
      type: "general_contact",
      inquiryId: result.inquiryId,
      leadSaved: result.leadSaved,
      notificationSent: result.notificationSent,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof ContactSubmissionError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(
      JSON.stringify({
        event: "contact_unhandled_error",
        name: e instanceof Error ? e.name : "unknown",
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
