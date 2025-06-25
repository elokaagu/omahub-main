import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function POST(request: NextRequest) {
  try {
    console.log("🏗️ Adding sample bookings data...");

    const supabase = await createServerSupabaseClient();

    // Check if user is super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Get some brand IDs to use
    const { data: brands } = await supabase
      .from("brands")
      .select("id, name")
      .limit(5);

    if (!brands || brands.length === 0) {
      return NextResponse.json({ error: "No brands found" }, { status: 400 });
    }

    console.log(`📊 Found ${brands.length} brands for sample bookings`);

    // Sample bookings data
    const sampleBookings = [
      {
        brand_id: brands[0].id,
        customer_name: "Adaora Okafor",
        customer_email: "adaora.okafor@example.com",
        customer_phone: "+234-801-234-5678",
        booking_type: "custom_order",
        status: "completed",
        booking_value: 150000,
        commission_rate: 5.0,
        commission_amount: 7500,
        booking_date: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(), // 15 days ago
        completion_date: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // 3 days ago
        notes: "Custom wedding dress with beadwork",
      },
      {
        brand_id: brands[1]?.id || brands[0].id,
        customer_name: "Kemi Adeleke",
        customer_email: "kemi.adeleke@example.com",
        customer_phone: "+234-802-345-6789",
        booking_type: "ready_to_wear",
        status: "completed",
        booking_value: 85000,
        commission_rate: 3.0,
        commission_amount: 2550,
        booking_date: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(), // 8 days ago
        completion_date: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 day ago
        notes: "Ankara dress set for corporate event",
      },
      {
        brand_id: brands[0].id,
        customer_name: "Chioma Nwachukwu",
        customer_email: "chioma.nwachukwu@example.com",
        customer_phone: "+234-803-456-7890",
        booking_type: "consultation",
        status: "completed",
        booking_value: 25000,
        commission_rate: 10.0,
        commission_amount: 2500,
        booking_date: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(), // 5 days ago
        completion_date: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 days ago
        notes: "Bridal styling consultation",
      },
      {
        brand_id: brands[2]?.id || brands[0].id,
        customer_name: "Funmi Ogundipe",
        customer_email: "funmi.ogundipe@example.com",
        customer_phone: "+234-804-567-8901",
        booking_type: "custom_order",
        status: "in_progress",
        booking_value: 200000,
        commission_rate: 5.0,
        commission_amount: 10000,
        booking_date: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 days ago
        delivery_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // 14 days from now
        notes: "Traditional Nigerian gown for cultural event",
      },
      {
        brand_id: brands[1]?.id || brands[0].id,
        customer_name: "Tolu Bakare",
        customer_email: "tolu.bakare@example.com",
        customer_phone: "+234-805-678-9012",
        booking_type: "alteration",
        status: "completed",
        booking_value: 15000,
        commission_rate: 15.0,
        commission_amount: 2250,
        booking_date: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(), // 10 days ago
        completion_date: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(), // 5 days ago
        notes: "Hem adjustment and sleeve alteration",
      },
      // Add some older bookings for trend data
      {
        brand_id: brands[0].id,
        customer_name: "Ngozi Emeka",
        customer_email: "ngozi.emeka@example.com",
        customer_phone: "+234-806-789-0123",
        booking_type: "custom_order",
        status: "completed",
        booking_value: 180000,
        commission_rate: 5.0,
        commission_amount: 9000,
        booking_date: new Date(
          Date.now() - 45 * 24 * 60 * 60 * 1000
        ).toISOString(), // 45 days ago
        completion_date: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days ago
        notes: "Aso-ebi for wedding party",
      },
    ];

    // Insert sample bookings
    const { data: insertedBookings, error: insertError } = await supabase
      .from("bookings")
      .insert(sampleBookings)
      .select();

    if (insertError) {
      console.error("❌ Error inserting sample bookings:", insertError);
      return NextResponse.json(
        {
          error: "Failed to insert sample bookings",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Successfully inserted ${insertedBookings.length} sample bookings`
    );

    // Calculate summary
    const totalValue = sampleBookings.reduce(
      (sum, b) => sum + b.booking_value,
      0
    );
    const totalCommission = sampleBookings.reduce(
      (sum, b) => sum + b.commission_amount,
      0
    );

    return NextResponse.json({
      success: true,
      message: `Added ${insertedBookings.length} sample bookings`,
      summary: {
        totalBookings: insertedBookings.length,
        totalValue,
        totalCommission,
        brands: brands.map((b) => b.name),
      },
      bookings: insertedBookings,
    });
  } catch (error) {
    console.error("❌ Error adding sample bookings:", error);
    return NextResponse.json(
      {
        error: "Failed to add sample bookings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
