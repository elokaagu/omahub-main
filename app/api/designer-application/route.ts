import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Airtable configuration
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_TABLE_NAME = "Designer Applications";

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error("Missing Airtable configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Submit to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Brand Name": formData.brandName,
            "Designer Name": formData.designerName,
            Email: formData.email,
            Phone: formData.phone || "",
            Website: formData.website || "",
            Instagram: formData.instagram || "",
            Location: formData.location,
            Category: formData.category,
            Description: formData.description,
            "Year Founded": formData.yearFounded || "",
            "Submission Date": new Date().toISOString(),
            Status: "New",
          },
        }),
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error("Airtable API error:", errorData);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    const result = await airtableResponse.json();
    console.log("Application submitted successfully:", result.id);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Error processing designer application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
