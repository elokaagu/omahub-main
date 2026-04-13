import { NextRequest, NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import { handlePutCommissionStructure } from "@/lib/services/adminLeadsHttpHandlers";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const auth = await requireLeadsAdmin();
  if (!auth.ok) return auth.response;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return await handlePutCommissionStructure(body, auth.ctx);
  } catch (error) {
    console.error("PUT /api/admin/commission-structure error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
