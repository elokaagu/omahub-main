import { NextRequest, NextResponse } from "next/server";
import {
  notifyAdminsOfNewProfile,
  type NewProfileNotificationInput,
} from "@/lib/services/newAccountAdminNotification";

const processedWebhookIds = new Set<string>();

function parseBearerToken(value: string | null): string | null {
  if (!value) return null;
  const [scheme, token, ...rest] = value.split(" ");
  if (rest.length > 0) return null;
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function safeSecretMatch(input: string, secret: string): boolean {
  if (input.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

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

    const token = parseBearerToken(request.headers.get("authorization"));
    if (!token || !safeSecretMatch(token, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhookId = request.headers.get("x-webhook-id");
    if (webhookId) {
      if (processedWebhookIds.has(webhookId)) {
        return NextResponse.json({ ok: true, deduplicated: true }, { status: 200 });
      }
      processedWebhookIds.add(webhookId);
      if (processedWebhookIds.size > 5000) {
        processedWebhookIds.clear();
      }
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const { type, table, record } = body;

    if (type !== "INSERT" || table !== "profiles") {
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }

    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return NextResponse.json({ message: "Invalid record" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
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
