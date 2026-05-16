import { NextRequest, NextResponse } from "next/server";
import { getOmaHubPlatformBrandId } from "@/lib/config/platformBrand";
import {
  checkPublicLeadRateLimit,
  getPublicLeadRateLimitClientKey,
} from "@/lib/rate-limit/publicLeadRateLimit";
import {
  sendEventWaitlistConfirmationToCustomer,
  sendNewLeadNotificationToBrand,
} from "@/lib/services/emailService";
import { getAdminClient } from "@/lib/supabase-admin";
import {
  buildEventWaitlistLeadNotes,
  eventWaitlistPostBodySchema,
  isEventWaitlistHoneypotTriggered,
  stripEventWaitlistHoneypotFields,
} from "@/lib/validation/eventWaitlistPostBody";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (isEventWaitlistHoneypotTriggered(body)) {
    console.error(
      JSON.stringify({
        event: "event_waitlist_honeypot_triggered",
        path: "/api/event-waitlist",
        userAgent: request.headers.get("user-agent") ?? "",
      })
    );
    return NextResponse.json({ success: true });
  }

  if (!checkPublicLeadRateLimit(getPublicLeadRateLimitClientKey(request))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const stripped = stripEventWaitlistHoneypotFields(body);
  const parsed = eventWaitlistPostBodySchema.safeParse(stripped);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or incomplete submission" },
      { status: 400 }
    );
  }

  const p = parsed.data;
  const platformBrandId = getOmaHubPlatformBrandId();
  const notes = buildEventWaitlistLeadNotes(p);

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
      .eq("id", platformBrandId)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json(
        {
          error:
            "Preorder signup is temporarily unavailable. Please email info@oma-hub.com with the designer, item, and size you want reserved.",
        },
        { status: 503 }
      );
    }

    const now = new Date().toISOString();
    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({
        brand_id: platformBrandId,
        customer_name: p.name,
        customer_email: p.email,
        customer_phone: p.phone?.trim() || null,
        source: "website",
        lead_type: "product_interest",
        notes,
        estimated_value: null,
        priority: "normal",
        status: "new",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error(
        "event_waitlist_insert_error",
        leadError?.code,
        leadError?.message
      );
      return NextResponse.json(
        { error: "Unable to save your request. Please try again later." },
        { status: 500 }
      );
    }

    // Await sends so the serverless function does not exit before Resend completes.
    const customerEmailResult = await sendEventWaitlistConfirmationToCustomer({
      to: p.email,
      customerName: p.name,
      requestedBrand: p.requestedBrand,
      itemDescription: p.itemDescription,
      size: p.size,
    });

    if (!customerEmailResult.success) {
      console.error("event_waitlist_customer_email_failed", {
        to: p.email,
        error: customerEmailResult.error,
      });
    }

    if (brand.contact_email) {
      const brandEmailResult = await sendNewLeadNotificationToBrand({
        to: brand.contact_email,
        brandName: brand.name ?? "OmaHub",
        customerName: p.name,
        customerEmail: p.email,
        source: "website",
        leadType: "product_interest",
        notes,
      });

      if (!brandEmailResult.success) {
        console.error("event_waitlist_brand_email_failed", {
          to: brand.contact_email,
          error: brandEmailResult.error,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(
      "event_waitlist_post_failed",
      e instanceof Error ? e.message : e
    );
    return NextResponse.json(
      { error: "Unable to complete your request." },
      { status: 500 }
    );
  }
}
