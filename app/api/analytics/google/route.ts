import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

/**
 * API route to fetch page views from Google Analytics 4
 * Requires GOOGLE_ANALYTICS_PROPERTY_ID and GOOGLE_SERVICE_ACCOUNT_KEY environment variables
 * SUPER ADMIN ACCESS ONLY
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check if they are a super admin
    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a super admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied - Super admin only" }, { status: 403 });
    }

    console.log("✅ Google Analytics API: Super admin access granted for user:", user.email);

    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!propertyId || !serviceAccountKey) {
      console.warn("Google Analytics credentials not configured");
      return NextResponse.json({
        pageViews: null,
        message: "Google Analytics not configured. Using estimated page views.",
        source: "estimated",
      });
    }

    // Parse the service account key
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (error) {
      console.error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY format");
      return NextResponse.json({
        pageViews: null,
        message: "Invalid Google Analytics credentials format.",
        source: "estimated",
      });
    }

    // Get access token using JWT
    const accessToken = await getGoogleAccessToken(credentials);

    if (!accessToken) {
      return NextResponse.json({
        pageViews: null,
        message: "Failed to authenticate with Google Analytics.",
        source: "estimated",
      });
    }

    // Get the last 30 days of analytics data
    const endDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch analytics data from Google Analytics Data API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDate,
            },
          ],
          metrics: [
            {
              name: "screenPageViews",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Analytics API error:", response.status, errorText);

      return NextResponse.json({
        pageViews: null,
        message: `Google Analytics API error: ${response.status}`,
        source: "estimated",
      });
    }

    const data = await response.json();

    // Extract page views from the response
    const totalPageViews = data.rows?.[0]?.metricValues?.[0]?.value
      ? parseInt(data.rows[0].metricValues[0].value, 10)
      : 0;

    console.log("✅ Fetched Google Analytics data:", {
      totalPageViews,
      period: "30 days",
      propertyId,
    });

    return NextResponse.json({
      pageViews: totalPageViews,
      message: "Real page views from Google Analytics",
      source: "google-analytics",
      period: "30 days",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Google Analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Google Analytics data",
        pageViews: null,
        source: "estimated",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get Google access token using service account credentials
 */
async function getGoogleAccessToken(credentials: any): Promise<string | null> {
  try {
    const jwt = await createJWT(credentials);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      console.error("Failed to get Google access token:", response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
}

/**
 * Create JWT for Google service account authentication
 */
async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, // 1 hour
    iat: now,
  };

  // For production, you'd want to use a proper JWT library
  // This is a simplified version - consider using 'jsonwebtoken' package
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key and sign
  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await signData(privateKey, signatureInput);

  return `${signatureInput}.${signature}`;
}

/**
 * Import RSA private key for signing
 */
async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

/**
 * Sign data with RSA private key
 */
async function signData(privateKey: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
