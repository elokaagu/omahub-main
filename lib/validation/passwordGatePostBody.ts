import { NextRequest, NextResponse } from "next/server";

/**
 * POST handlers that must not accept arbitrary JSON: empty body or `{}` only.
 */
export async function requireEmptyOrEmptyObjectBody(
  request: NextRequest
): Promise<NextResponse | null> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return null;
  }

  if (!text.trim()) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json(
      { error: "Body must be an empty JSON object" },
      { status: 400 }
    );
  }

  if (Object.keys(parsed as Record<string, unknown>).length > 0) {
    return NextResponse.json(
      { error: "Unexpected properties in request body" },
      { status: 400 }
    );
  }

  return null;
}
