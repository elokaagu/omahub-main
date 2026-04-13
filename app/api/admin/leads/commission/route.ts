import { NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import { handleLeadsCommissionGET } from "@/lib/services/adminLeadsHttpHandlers";

export const dynamic = "force-dynamic";

/** GET /api/admin/leads/commission — converted-lead commission summary (same logic as legacy GET /api/leads?action=commission). */
export async function GET() {
  const auth = await requireLeadsAdmin();
  if (!auth.ok) return auth.response;

  try {
    return await handleLeadsCommissionGET(auth.ctx);
  } catch (error) {
    console.error("GET /api/admin/leads/commission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
