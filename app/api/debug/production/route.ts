import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface DatabaseTest {
  success: boolean;
  error: string | null;
  count: number;
  sampleData: any[];
}

interface DatabaseTests {
  brands?: DatabaseTest;
  collections?: DatabaseTest;
  reviews?: DatabaseTest;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Basic environment check
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      supabaseUrl: supabaseUrl || "MISSING",
      keyPrefix: supabaseAnonKey
        ? supabaseAnonKey.substring(0, 20) + "..."
        : "MISSING",
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    };

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing Supabase environment variables",
          envCheck,
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test database connectivity
    const tests = {
      envCheck,
      databaseTests: {} as DatabaseTests,
      timestamp: new Date().toISOString(),
    };

    // Test brands table access
    try {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, name")
        .limit(3);

      tests.databaseTests.brands = {
        success: !brandsError,
        error: brandsError?.message || null,
        count: brands?.length || 0,
        sampleData: brands?.map((b) => ({ id: b.id, name: b.name })) || [],
      };
    } catch (error: any) {
      tests.databaseTests.brands = {
        success: false,
        error: error.message,
        count: 0,
        sampleData: [],
      };
    }

    // Test collections table access
    try {
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("id, title")
        .limit(3);

      tests.databaseTests.collections = {
        success: !collectionsError,
        error: collectionsError?.message || null,
        count: collections?.length || 0,
        sampleData:
          collections?.map((c) => ({ id: c.id, title: c.title })) || [],
      };
    } catch (error: any) {
      tests.databaseTests.collections = {
        success: false,
        error: error.message,
        count: 0,
        sampleData: [],
      };
    }

    // Test reviews table access
    try {
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, author")
        .limit(3);

      tests.databaseTests.reviews = {
        success: !reviewsError,
        error: reviewsError?.message || null,
        count: reviews?.length || 0,
        sampleData: reviews?.map((r) => ({ id: r.id, author: r.author })) || [],
      };
    } catch (error: any) {
      tests.databaseTests.reviews = {
        success: false,
        error: error.message,
        count: 0,
        sampleData: [],
      };
    }

    // Overall status
    const allTestsPassed = Object.values(tests.databaseTests).every(
      (test: DatabaseTest) => test.success
    );

    return NextResponse.json({
      status: allTestsPassed ? "success" : "partial_failure",
      message: allTestsPassed
        ? "All database tests passed"
        : "Some database tests failed",
      ...tests,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Production debug failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
