import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Send email using the email service
    const result = await sendContactEmail(formData);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Failed to send contact email:", result.error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
