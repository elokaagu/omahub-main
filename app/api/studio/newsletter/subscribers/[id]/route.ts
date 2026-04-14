import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

const SUBSCRIBER_SELECT_FIELDS =
  "id, email, first_name, last_name, subscription_status, preferences, subscribed_at, unsubscribed_at, created_at, updated_at";
const VALID_SUBSCRIPTION_STATUSES = [
  "active",
  "unsubscribed",
  "bounced",
  "pending",
] as const;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid subscriber ID" }, { status: 400 });
    }

    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Validate the update data
    const { subscription_status, preferences } = body as {
      subscription_status?: unknown;
      preferences?: unknown;
    };

    if (
      subscription_status !== undefined &&
      (typeof subscription_status !== "string" ||
        !VALID_SUBSCRIPTION_STATUSES.includes(
          subscription_status as (typeof VALID_SUBSCRIPTION_STATUSES)[number]
        ))
    ) {
      return NextResponse.json(
        { error: "Invalid subscription status" },
        { status: 400 }
      );
    }
    if (
      preferences !== undefined &&
      (typeof preferences !== "object" || preferences === null || Array.isArray(preferences))
    ) {
      return NextResponse.json(
        { error: "Preferences must be an object" },
        { status: 400 }
      );
    }
    if (subscription_status === undefined && preferences === undefined) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (subscription_status !== undefined) {
      updateData.subscription_status = subscription_status;
      
      // Set unsubscribed_at if status is unsubscribed
      if (subscription_status === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString();
      } else {
        updateData.unsubscribed_at = null;
      }
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    // Update the subscriber
    const { data: updatedSubscriber, error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update(updateData)
      .eq("id", id)
      .select(SUBSCRIBER_SELECT_FIELDS)
      .single();

    if (updateError) {
      console.error("❌ Error updating subscriber:", updateError.code);
      return NextResponse.json(
        { error: "Failed to update subscriber" },
        { status: 500 }
      );
    }

    console.info("Newsletter subscriber updated", {
      actorUserId: authz.userId,
      subscriberId: updatedSubscriber.id,
    });

    return NextResponse.json({
      success: true,
      subscriber: updatedSubscriber,
      message: "Subscriber updated successfully"
    });

  } catch (error) {
    console.error("💥 Newsletter subscriber update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid subscriber ID" }, { status: 400 });
    }

    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Soft-delete behavior: suppress subscriber rather than hard-delete the row.
    const { data: updatedSubscriber, error: deleteError } = await supabase
      .from("newsletter_subscribers")
      .update({
        subscription_status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .single();

    if (deleteError) {
      if (deleteError.code === "PGRST116") {
        return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
      }
      console.error("❌ Error suppressing subscriber:", deleteError.code);
      return NextResponse.json(
        { error: "Failed to update subscriber status" },
        { status: 500 }
      );
    }

    console.info("Newsletter subscriber suppressed", {
      actorUserId: authz.userId,
      subscriberId: updatedSubscriber.id,
    });

    return NextResponse.json({
      success: true,
      message: "Subscriber unsubscribed successfully"
    });

  } catch (error) {
    console.error("💥 Newsletter subscriber deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
