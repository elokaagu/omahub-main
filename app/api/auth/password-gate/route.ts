import { NextRequest, NextResponse } from "next/server";

const PLATFORM_PASSWORD = "omahub2024"; // Same password as in the frontend

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password === PLATFORM_PASSWORD) {
      // Create a response with success
      const response = NextResponse.json({
        success: true,
        message: "Access granted",
      });

      // Set a secure cookie to remember access
      response.cookies.set("omahub-access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Password gate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
