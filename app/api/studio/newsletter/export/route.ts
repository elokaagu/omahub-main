import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
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
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching subscribers for export:", error);
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

    const csvRows = subscribers?.map(subscriber => [
      subscriber.email,
      subscriber.first_name || "",
      subscriber.last_name || "",
      subscriber.subscription_status,
      subscriber.source,
      new Date(subscriber.subscribed_at).toISOString(),
      subscriber.unsubscribed_at ? new Date(subscriber.unsubscribed_at).toISOString() : "",
      subscriber.email_count.toString(),
      subscriber.last_email_sent ? new Date(subscriber.last_email_sent).toISOString() : "",
      new Date(subscriber.created_at).toISOString(),
      new Date(subscriber.updated_at).toISOString()
    ]) || [];

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
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
