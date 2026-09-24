import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getSuperAdminEmails } from "@/lib/services/adminEmailService.server";
import { sendMissingLineupImageAlert } from "@/lib/services/emailService";

export async function POST(request: NextRequest) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  let body: { brandName?: string; editionSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brandName = body.brandName?.trim();
  const editionSlug = body.editionSlug?.trim();
  if (!brandName || !editionSlug) {
    return NextResponse.json({ error: "Missing brand or edition" }, { status: 400 });
  }

  const recipients = await getSuperAdminEmails();
  console.info("missing_lineup_image_alert", {
    brandName,
    editionSlug,
    recipientCount: recipients.length,
  });
  const result = await sendMissingLineupImageAlert({
    to: recipients,
    brandName,
    editionSlug,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Could not send the missing-photo notice" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
