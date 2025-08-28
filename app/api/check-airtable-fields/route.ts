import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const AIRTABLE_TABLE_NAME = "tblbx8LHN9bdLiRS2";

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      return NextResponse.json(
        { error: "Missing Airtable configuration" },
        { status: 500 }
      );
    }

    // Get existing records to see field structure
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=3`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch table data",
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract field names from existing records
    const allFields = new Set<string>();
    data.records?.forEach((record: any) => {
      if (record.fields) {
        Object.keys(record.fields).forEach((field: any) => allFields.add(field));
      }
    });

    return NextResponse.json({
      success: true,
      tableId: AIRTABLE_TABLE_NAME,
      recordCount: data.records?.length || 0,
      existingFields: Array.from(allFields),
      requiredFields: [
        "Brand Name",
        "Designer Name",
        "Email",
        "Phone",
        "Website",
        "Instagram",
        "Location",
        "Category",
        "Description",
        "Year Founded",
        "Submission Date",
        "Status",
      ],
      sampleRecord: data.records?.[0] || null,
    });
  } catch (error) {
    console.error("Error checking Airtable fields:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
