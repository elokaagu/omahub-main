import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Airtable configuration
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const AIRTABLE_TABLE_NAME = "tblbx8LHN9bdLiRS2"; // Using the actual table ID from your Airtable

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error("Missing Airtable configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Include all fields including Phone and Instagram
    const fieldsToSubmit: any = {
      "Brand Name": formData.brandName,
      "Designer Name": formData.designerName,
      Email: formData.email,
      Website: formData.website || "",
      Location: formData.location,
      Category: formData.category,
      Description: formData.description,
      Status: "New",
    };

    // Add Phone if provided
    if (formData.phone) {
      fieldsToSubmit["Phone Number"] = formData.phone;
    }

    // Add Instagram if provided
    if (formData.instagram) {
      fieldsToSubmit["Instagram"] = formData.instagram;
    }

    // Handle Year Founded - try as number first, then as string
    if (formData.yearFounded) {
      const year = parseInt(formData.yearFounded);
      if (!isNaN(year)) {
        fieldsToSubmit["Year Founded"] = year;
      }
    }

    // Handle Submission Date - try different date formats
    try {
      const now = new Date();
      // Try just the date part (YYYY-MM-DD)
      fieldsToSubmit["Submission Date"] = now.toISOString().split("T")[0];
    } catch (e) {
      // If date fails, we'll skip it
      console.log("Skipping Submission Date due to format issues");
    }

    console.log("Submitting fields:", fieldsToSubmit);

    // Submit to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: fieldsToSubmit,
        }),
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error("Airtable API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to submit application",
          details: errorData,
          submittedFields: Object.keys(fieldsToSubmit),
        },
        { status: 500 }
      );
    }

    const result = await airtableResponse.json();
    console.log("Application submitted successfully:", result.id);

    return NextResponse.json({
      success: true,
      id: result.id,
      submittedFields: Object.keys(fieldsToSubmit),
      message: "All fields submitted successfully!",
    });
  } catch (error) {
    console.error("Error processing designer application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
