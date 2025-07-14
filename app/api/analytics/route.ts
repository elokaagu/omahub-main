import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_API_TOKEN;
  const project = "oma-hub.com"; // Change if your Vercel project slug is different

  if (!token) {
    return NextResponse.json(
      { error: "Missing Vercel API token" },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.vercel.com/v6/analytics/projects/${project}/stats?range=7d`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch analytics" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
