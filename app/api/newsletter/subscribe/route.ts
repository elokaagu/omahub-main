import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendNewsletterConfirmationEmail } from "@/lib/services/emailService";
import {
  checkNewsletterSubscribeRateLimit,
  getNewsletterSubscribeClientKey,
} from "@/lib/rate-limit/newsletterSubscribeRateLimit";
import {
  isNewsletterHoneypotTriggered,
  parseNewsletterSubscribeBody,
} from "@/lib/validation/newsletterSubscribeBody";

const GENERIC_SUCCESS_MESSAGE =
  "If this email is eligible, you will receive a confirmation shortly.";

type SubscriberRow = {
  id: string;
  subscription_status: "active" | "unsubscribed";
};

function normalizeName(value: string | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isNewsletterHoneypotTriggered(raw)) {
    return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
  }

  if (!checkNewsletterSubscribeRateLimit(getNewsletterSubscribeClientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const parsed = parseNewsletterSubscribeBody(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const firstName = normalizeName(parsed.data.firstName);
  const lastName = normalizeName(parsed.data.lastName);
  const source = parsed.data.source;

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: existingSubscriber, error: checkError } = await supabase
    .from("newsletter_subscribers")
    .select("id, subscription_status")
    .eq("email", email)
    .maybeSingle<SubscriberRow>();

  if (checkError) {
    console.error("newsletter_subscribe_check_failed", checkError.message);
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }

  try {
    if (existingSubscriber?.subscription_status === "active") {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    if (existingSubscriber?.subscription_status === "unsubscribed") {
      const { error: reactivateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          subscription_status: "active",
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
          first_name: firstName,
          last_name: lastName,
          source,
        })
        .eq("id", existingSubscriber.id);

      if (reactivateError) {
        console.error("newsletter_reactivate_failed", reactivateError.message);
        return NextResponse.json(
          { error: "Unable to process request" },
          { status: 500 }
        );
      }

      void sendNewsletterConfirmationEmail({
        email,
        firstName: firstName || "there",
        lastName: lastName || "",
        isReactivation: true,
      });

      return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    const { error: insertError } = await supabase.from("newsletter_subscribers").insert({
      email,
      first_name: firstName,
      last_name: lastName,
      source,
      subscription_status: "active",
      preferences: {
        marketing: true,
        designer_updates: true,
        events: true,
      },
    });

    // Handle race on unique(email) cleanly.
    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("newsletter_insert_failed", insertError.message);
        return NextResponse.json(
          { error: "Unable to process request" },
          { status: 500 }
        );
      }
    }

    void sendNewsletterConfirmationEmail({
      email,
      firstName: firstName || "there",
      lastName: lastName || "",
      isReactivation: false,
    });

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    console.error(
      "newsletter_subscribe_failed",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }
}

// Disabled to prevent public email-status enumeration.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
