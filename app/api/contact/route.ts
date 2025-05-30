import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/services/emailService";

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const result = await sendContactEmail(formData);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in contact API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
