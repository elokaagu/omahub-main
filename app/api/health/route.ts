import { NextResponse } from "next/server";
import {
  computeSystemHealth,
  getHealthAppVersion,
} from "@/lib/health/systemHealth";

export const dynamic = "force-dynamic";

/**
 * Readiness-style health: critical env + optional DB probe + email config hint.
 * - `healthy` / `degraded` → 200 (degraded = missing optional pieces, e.g. email or DB probe skipped)
 * - `unhealthy` → 503 (missing public Supabase env or DB probe failed)
 */
export async function GET() {
  const { status, checks, httpStatus } = await computeSystemHealth();
  const version = getHealthAppVersion();

  const res = NextResponse.json(
    {
      status,
      service: "OmaHub API",
      timestamp: new Date().toISOString(),
      version,
      checks,
    },
    { status: httpStatus }
  );
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
