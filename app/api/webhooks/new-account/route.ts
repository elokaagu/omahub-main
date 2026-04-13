import { NextRequest, NextResponse } from "next/server";
import {
  notifyAdminsOfNewProfile,
  type NewProfileNotificationInput,
} from "@/lib/services/newAccountAdminNotification";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error(
        JSON.stringify({ event: "new_account_webhook_misconfigured" })
      );
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, table, record } = body;

    if (type !== "INSERT" || table !== "profiles") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const newUser = record as Record<string, unknown>;
    const payload: NewProfileNotificationInput = {
      id: String(newUser.id ?? ""),
      email: String(newUser.email ?? ""),
      role: String(newUser.role ?? "user"),
      created_at: String(
        newUser.created_at ?? new Date().toISOString()
      ),
    };

    if (!payload.id || !payload.email) {
      return NextResponse.json({ message: "Invalid record" }, { status: 400 });
    }

    await notifyAdminsOfNewProfile(payload);

    return NextResponse.json({
      message: "New account notification processed successfully",
      user_email: payload.email,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "new_account_webhook_error",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
