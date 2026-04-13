import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { deleteBrandAsUser } from "@/lib/services/brandDeletion.server";
import { parsePublicBrandIdParam } from "@/lib/validation/brandIdParam";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idParsed = parsePublicBrandIdParam(params.id);
  if (!idParsed.ok) {
    return NextResponse.json({ error: idParsed.error }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await deleteBrandAsUser(supabase, idParsed.value);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { message: `Brand "${result.brandName}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "delete_brand_route_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
