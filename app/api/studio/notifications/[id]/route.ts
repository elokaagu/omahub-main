import { NextRequest, NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId, supabase } = auth;
    const notificationId = params.id;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { is_read } = body as { is_read?: unknown };
    if (typeof is_read !== "boolean") {
      return NextResponse.json({ error: "is_read must be a boolean" }, { status: 400 });
    }

    const { data: row, error: fetchError } = await supabase
      .from("notifications")
      .select("id, user_id")
      .eq("id", notificationId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: "Failed to load notification" }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    if (row.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification PATCH error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
