import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Try to get a signed URL
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl("test-image.jpg", 60);

    if (signedError) {
      return NextResponse.json(
        { success: false, error: signedError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, signedUrl });
  } catch (error) {
    console.error("Test auth image error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
