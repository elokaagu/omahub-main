import { NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import { handleLeadsAnalyticsGET } from "@/lib/services/adminLeadsHttpHandlers";

export const dynamic = "force-dynamic";

/** GET /api/admin/leads/analytics — platform leads analytics (RPC + fallback). */
export async function GET() {
  const auth = await requireLeadsAdmin();
  if (!auth.ok) return auth.response;

  try {
    return await handleLeadsAnalyticsGET(auth.ctx);
  } catch (error) {
    console.error("GET /api/admin/leads/analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
