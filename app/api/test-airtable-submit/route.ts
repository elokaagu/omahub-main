import { NextRequest, NextResponse } from "next/server";

export async function POST() {
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

    // Test with minimal data first
    const testData = {
      fields: {
        Name: "Test Entry",
        Email: "test@example.com",
      },
    };

    console.log("Attempting to submit to Airtable:", {
      baseId: AIRTABLE_BASE_ID,
      tableId: AIRTABLE_TABLE_NAME,
      data: testData,
    });

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    const responseText = await airtableResponse.text();
    console.log("Airtable response:", {
      status: airtableResponse.status,
      statusText: airtableResponse.statusText,
      body: responseText,
    });

    if (!airtableResponse.ok) {
      return NextResponse.json(
        {
          error: "Airtable submission failed",
          status: airtableResponse.status,
          statusText: airtableResponse.statusText,
          details: responseText,
          url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
        },
        { status: 400 }
      );
    }

    const result = JSON.parse(responseText);
    return NextResponse.json({
      success: true,
      result,
      message: "Test submission successful",
    });
  } catch (error) {
    console.error("Error in test submission:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
