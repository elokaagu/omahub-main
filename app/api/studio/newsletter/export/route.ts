import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export const dynamic = "force-dynamic";

type NewsletterExportRow = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  subscription_status: string | null;
  source: string | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  email_count: number | null;
  last_email_sent: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function toIsoOrEmpty(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function escapeCsvField(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

export async function GET(_request: NextRequest) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Get all subscribers
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select(
        "email, first_name, last_name, subscription_status, source, subscribed_at, unsubscribed_at, email_count, last_email_sent, created_at, updated_at"
      )
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching subscribers for export:", error.code);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      "Email",
      "First Name",
      "Last Name",
      "Status",
      "Source",
      "Subscribed Date",
      "Unsubscribed Date",
      "Emails Sent",
      "Last Email Sent",
      "Created Date",
      "Updated Date"
    ];

    const csvRows = ((subscribers ?? []) as NewsletterExportRow[]).map((subscriber) => [
      subscriber.email ?? "",
      subscriber.first_name ?? "",
      subscriber.last_name ?? "",
      subscriber.subscription_status ?? "",
      subscriber.source ?? "",
      toIsoOrEmpty(subscriber.subscribed_at),
      toIsoOrEmpty(subscriber.unsubscribed_at),
      subscriber.email_count !== null && subscriber.email_count !== undefined
        ? String(subscriber.email_count)
        : "0",
      toIsoOrEmpty(subscriber.last_email_sent),
      toIsoOrEmpty(subscriber.created_at),
      toIsoOrEmpty(subscriber.updated_at),
    ]) || [];

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((field) => escapeCsvField(field)).join(","))
    ].join("\n");

    console.info("Newsletter export completed", {
      actorUserId: authz.userId,
      exportedRows: csvRows.length,
      exportedAt: new Date().toISOString(),
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "X-Export-Generated-At": new Date().toISOString(),
        "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("💥 Newsletter export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
