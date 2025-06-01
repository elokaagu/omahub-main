import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      return NextResponse.json(
        {
          error: "Missing Airtable configuration",
          hasBaseId: !!AIRTABLE_BASE_ID,
          hasApiKey: !!AIRTABLE_API_KEY,
        },
        { status: 500 }
      );
    }

    // Try different possible table names
    const possibleTableNames = [
      "Designer Applications",
      "Applications",
      "Designers",
      "Table 1",
      "tblbx8LHN9bdLiRS2", // The table ID from your URL
    ];

    const results = [];

    for (const tableName of possibleTableNames) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            tableName,
            status: "success",
            recordCount: data.records?.length || 0,
            fields: data.records?.[0]?.fields
              ? Object.keys(data.records[0].fields)
              : [],
          });
        } else {
          results.push({
            tableName,
            status: "error",
            statusCode: response.status,
            error: await response.text(),
          });
        }
      } catch (err) {
        results.push({
          tableName,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      baseId: AIRTABLE_BASE_ID,
      results,
      message: "Airtable connection test completed",
    });
  } catch (error) {
    console.error("Error testing Airtable connection:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
