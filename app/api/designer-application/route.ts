import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";
import {
  sendNewApplicationNotification,
  sendApplicationConfirmationEmail,
} from "@/lib/services/emailService";
import {
  checkDesignerApplicationRateLimit,
  getDesignerApplicationClientKey,
} from "@/lib/rate-limit/designerApplicationRateLimit";
import {
  designerApplicationBodySchema,
  parseYearFounded,
} from "@/lib/validation/designerApplicationBody";

const DEDUPE_WINDOW_MS = 60 * 60 * 1000;

function logEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>
) {
  console.error(JSON.stringify({ event, ...fields }));
}

export async function POST(request: NextRequest) {
  try {
    if (
      !checkDesignerApplicationRateLimit(
        getDesignerApplicationClientKey(request)
      )
    ) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = designerApplicationBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = parsed.data;
    logEvent("designer_app_received", {});

    const supabase = await getAdminClient();
    if (!supabase) {
      logEvent("designer_app_admin_client_missing", {});
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { data: recentSameEmail } = await supabase
      .from("designer_applications")
      .select("id")
      .eq("email", body.email)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    if (recentSameEmail) {
      return NextResponse.json(
        {
          error:
            "A submission was recently received from this email. Please wait before applying again.",
        },
        { status: 429 }
      );
    }

    const yearFounded = parseYearFounded(body.yearFounded);

    const applicationData = {
      brand_name: body.brandName,
      designer_name: body.designerName,
      email: body.email,
      phone: body.phone,
      website: body.website,
      instagram: body.instagram
        ? `@${body.instagram.replace(/^@+/, "")}`
        : null,
      location: body.location,
      category: body.category,
      description: body.description,
      year_founded: yearFounded,
      status: "new" as const,
    };

    const { data: application, error: insertError } = await supabase
      .from("designer_applications")
      .insert(applicationData)
      .select("id")
      .single();

    if (insertError) {
      logEvent("designer_app_insert_failed", {
        code: insertError.code ?? "unknown",
      });
      return NextResponse.json(
        { error: "Failed to submit application. Please try again." },
        { status: 500 }
      );
    }

    if (!application?.id) {
      logEvent("designer_app_insert_no_id", {});
      return NextResponse.json(
        {
          error:
            "Application submitted but could not be verified. Please contact support.",
        },
        { status: 500 }
      );
    }

    logEvent("designer_app_persisted", { applicationId: application.id });

    // Brand is created when an admin approves the application (see studio/applications/[id]).

    try {
      const confirmationResult = await sendApplicationConfirmationEmail({
        designerName: body.designerName,
        brandName: body.brandName,
        email: body.email,
      });
      logEvent("designer_app_confirmation_email", {
        ok: confirmationResult.success,
      });
    } catch {
      logEvent("designer_app_confirmation_email_exception", {});
    }

    try {
      const superAdminEmails =
        await adminEmailServiceServer.getSuperAdminEmails();
      const count = Array.isArray(superAdminEmails)
        ? superAdminEmails.length
        : 0;

      if (count === 0) {
        logEvent("designer_app_admin_notify_skipped", { reason: "no_recipients" });
      } else {
        const emailApplicationData = {
          id: application.id,
          brand_name: body.brandName,
          designer_name: body.designerName,
          email: body.email,
          phone: body.phone ?? undefined,
          website: body.website ?? undefined,
          instagram: body.instagram
            ? `@${body.instagram.replace(/^@+/, "")}`
            : undefined,
          location: body.location,
          category: body.category,
          description: body.description,
          year_founded: yearFounded ?? undefined,
          created_at: new Date().toISOString(),
        };

        const emailResult = await sendNewApplicationNotification(
          emailApplicationData,
          superAdminEmails
        );
        logEvent("designer_app_admin_notify", {
          ok: emailResult.success,
          recipientCount: count,
        });
      }
    } catch {
      logEvent("designer_app_admin_notify_exception", {});
    }

    const res = NextResponse.json({
      success: true,
      id: application.id,
      applicationId: application.id,
      message:
        "Application submitted successfully! We'll review your portfolio and get back to you within 5-7 business days.",
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    logEvent("designer_app_unhandled", {});
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
