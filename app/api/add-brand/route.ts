import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-unified";

export async function GET() {
  try {
    const supabase = createAdminClient();

    console.log("🏷️ Adding Ebhs Couture brand to database...");

    const brandData = {
      id: "ebhs-couture",
      name: "Ebhs Couture",
      description:
        "Exquisite couture designs for the modern woman, blending traditional craftsmanship with contemporary elegance.",
      long_description:
        "Ebhs Couture creates show stopping pieces that celebrate the modern woman. Our designs blend traditional African craftsmanship with contemporary silhouettes, using luxurious fabrics and intricate details. Each piece is meticulously crafted to make you feel confident and beautiful for any special occasion.",
      category: "Fashion Designer",
      location: "Abuja, Nigeria",
      price_range: "₦50,000 - ₦500,000",
      contact_email: "hello@ebhscouture.com",
      contact_phone: "+234-803-123-4567",
      website: "https://ebhscouture.com",
      instagram: "@ebhscouture",
      rating: 4.8,
      is_verified: true,
      image:
        "https://gqwduyodzqgucjscilvz.supabase.co/storage/v1/object/public/brand-assets/brands/ebhs-couture-hero.jpg",
      created_at: new Date().toISOString(),
    };

    // Check if brand already exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", "ebhs-couture")
      .single();

    if (existingBrand) {
      console.log("✅ Brand already exists:", existingBrand.name);
      return NextResponse.json({
        success: true,
        message: "Ebhs Couture brand already exists!",
        brand: existingBrand,
        action: "already_exists",
      });
    }

    const { data, error } = await supabase
      .from("brands")
      .insert(brandData)
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding brand:", error);
      return NextResponse.json(
        {
          error: "Failed to add brand: " + error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Brand added successfully:", data.name);

    return NextResponse.json({
      success: true,
      message: "Ebhs Couture brand added successfully!",
      brand: data,
      action: "created",
    });
  } catch (error) {
    console.error("❌ Add brand API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
