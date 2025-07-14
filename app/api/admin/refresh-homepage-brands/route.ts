import { NextRequest, NextResponse } from "next/server";
import { getAllBrands } from "@/lib/services/brandService";
import { getProfile } from "@/lib/services/authService";

// POST: Refresh homepage brands (super admin only)
export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    const profile = await getProfile(user?.id);
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Simulate refresh: fetch all brands (in real use, could update a cache or trigger a revalidation)
    await getAllBrands(false, true);

    return NextResponse.json({
      success: true,
      message: "Homepage brands refreshed.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to refresh homepage brands" },
      { status: 500 }
    );
  }
}
