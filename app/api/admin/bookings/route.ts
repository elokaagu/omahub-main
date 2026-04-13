import { NextRequest, NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import {
  handleDeleteBooking,
  handlePostBooking,
  handlePutBooking,
} from "@/lib/services/adminLeadsHttpHandlers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireLeadsAdmin();
  if (!auth.ok) return auth.response;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return await handlePostBooking(body, auth.ctx);
  } catch (error) {
    console.error("POST /api/admin/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    return await handlePutBooking(body, auth.ctx);
  } catch (error) {
    console.error("PUT /api/admin/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireLeadsAdmin();
  if (!auth.ok) return auth.response;
  try {
    return await handleDeleteBooking(
      new URL(request.url).searchParams,
      auth.ctx
    );
  } catch (error) {
    console.error("DELETE /api/admin/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
