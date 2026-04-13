import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { AIRTABLE_DESIGNER_APPLICATION_EXPECTED_FIELDS } from "@/lib/config/airtableDesignerApplicationFields";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 120_000;
let memoryCache: { expiresAt: number; payload: Record<string, unknown> } | null =
  null;

/**
 * Super-admin debug: introspect Airtable table schema vs expected fields.
 * Production: set `ENABLE_AIRTABLE_SCHEMA_DEBUG=true` or this returns 404.
 * Table id: `AIRTABLE_DESIGNER_APPLICATIONS_TABLE_ID` (or `AIRTABLE_TABLE_ID`).
 */
export async function GET() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_AIRTABLE_SCHEMA_DEBUG !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const tableId =
    process.env.AIRTABLE_DESIGNER_APPLICATIONS_TABLE_ID ||
    process.env.AIRTABLE_TABLE_ID;

  if (!baseId || !apiKey || !tableId) {
    return NextResponse.json(
      {
        error:
          "Missing configuration (AIRTABLE_BASE_ID, AIRTABLE_PERSONAL_ACCESS_TOKEN, AIRTABLE_DESIGNER_APPLICATIONS_TABLE_ID)",
      },
      { status: 503 }
    );
  }

  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    const res = NextResponse.json(memoryCache.payload);
    res.headers.set("X-Schema-Cache", "HIT");
    return res;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}?maxRecords=3`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        JSON.stringify({
          event: "airtable_schema_fetch_failed",
          status: response.status,
          body_preview: errorText.slice(0, 200),
        })
      );
      return NextResponse.json(
        { error: "Failed to fetch from Airtable" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    const allFields = new Set<string>();
    for (const record of data.records ?? []) {
      if (record.fields) {
        for (const field of Object.keys(record.fields)) {
          allFields.add(field);
        }
      }
    }

    const payload = {
      success: true,
      tableId,
      recordCount: data.records?.length ?? 0,
      existingFields: Array.from(allFields).sort(),
      requiredFields: [...AIRTABLE_DESIGNER_APPLICATION_EXPECTED_FIELDS],
      sampleRecord: data.records?.[0] ?? null,
    };

    memoryCache = {
      expiresAt: now + CACHE_TTL_MS,
      payload,
    };

    const res = NextResponse.json(payload);
    res.headers.set("X-Schema-Cache", "MISS");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "airtable_schema_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
