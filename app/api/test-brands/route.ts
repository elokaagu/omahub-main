import { NextRequest, NextResponse } from "next/server";
import { getAllBrands, getBrandById } from "@/lib/services/brandService";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing brand loading...");

    // Test getting all brands
    const brands = await getAllBrands();
    console.log(`📊 Found ${brands.length} brands`);

    // Test getting a specific brand
    const testBrand = await getBrandById("adire-designs");
    console.log(
      "🎯 Test brand result:",
      testBrand ? testBrand.name : "Not found"
    );

    return NextResponse.json({
      success: true,
      totalBrands: brands.length,
      brands: brands.slice(0, 3), // Return first 3 brands
      testBrand: testBrand,
      message: "Brand loading test completed",
    });
  } catch (error) {
    console.error("❌ Error testing brands:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Brand loading test failed",
      },
      { status: 500 }
    );
  }
}
