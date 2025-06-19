import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Types for the leads tracking system
export interface Lead {
  id?: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  source:
    | "website"
    | "whatsapp"
    | "instagram"
    | "email"
    | "phone"
    | "referral"
    | "direct";
  lead_type:
    | "inquiry"
    | "quote_request"
    | "booking_intent"
    | "consultation"
    | "product_interest";
  status: "new" | "contacted" | "qualified" | "converted" | "lost" | "closed";
  priority?: "low" | "normal" | "high" | "urgent";
  estimated_value?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  contacted_at?: string;
  qualified_at?: string;
  converted_at?: string;
}

export interface Booking {
  id?: string;
  lead_id?: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_type:
    | "custom_order"
    | "ready_to_wear"
    | "consultation"
    | "fitting"
    | "alteration"
    | "rental";
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "refunded";
  booking_value: number;
  commission_rate?: number;
  commission_amount?: number;
  currency?: string;
  booking_date?: string;
  delivery_date?: string;
  completion_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadsAnalytics {
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  total_bookings: number;
  total_booking_value: number;
  total_commission_earned: number;
  average_booking_value: number;
  conversion_rate: number;
  this_month_leads: number;
  this_month_bookings: number;
  this_month_revenue: number;
  this_month_commission: number;
  top_performing_brands: any[];
  leads_by_source: Record<string, number>;
  bookings_by_type: Record<string, number>;
  monthly_trends: any[];
}

// Helper function to check user permissions
async function checkUserPermissions(userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("User profile not found");
  }

  return profile;
}

// GET /api/admin/leads - Fetch leads and analytics
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await checkUserPermissions(user.id);

    if (
      !profile.role ||
      !["super_admin", "brand_admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const brandId = searchParams.get("brand_id");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Handle different GET actions
    switch (action) {
      case "analytics":
        // Get comprehensive analytics using the database function
        const { data: analyticsData, error: analyticsError } =
          await supabase.rpc("get_leads_analytics", { admin_user_id: user.id });

        if (analyticsError) {
          console.error("Analytics error:", analyticsError);
          return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          analytics: analyticsData[0] || {
            total_leads: 0,
            qualified_leads: 0,
            converted_leads: 0,
            total_bookings: 0,
            total_booking_value: 0,
            total_commission_earned: 0,
            average_booking_value: 0,
            conversion_rate: 0,
            this_month_leads: 0,
            this_month_bookings: 0,
            this_month_revenue: 0,
            this_month_commission: 0,
            top_performing_brands: [],
            leads_by_source: {},
            bookings_by_type: {},
            monthly_trends: [],
          },
        });

      case "bookings":
        // Fetch bookings
        let bookingsQuery = supabaseClient
          .from("bookings")
          .select(
            `
            *,
            brands:brand_id (name, image),
            leads:lead_id (customer_name, customer_email, source, lead_type)
          `
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (profile.role === "brand_admin" && profile.owned_brands) {
          bookingsQuery = bookingsQuery.in("brand_id", profile.owned_brands);
        }

        if (brandId) {
          bookingsQuery = bookingsQuery.eq("brand_id", brandId);
        }

        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (bookingsError) {
          console.error("Bookings error:", bookingsError);
          return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
          );
        }

        return NextResponse.json({ bookings });

      case "commission_structure":
        // Fetch commission structure (super admin only)
        if (profile.role !== "super_admin") {
          return NextResponse.json(
            { error: "Super admin access required" },
            { status: 403 }
          );
        }

        const { data: commissionStructure, error: commissionError } =
          await supabase
            .from("commission_structure")
            .select("*")
            .eq("is_active", true)
            .order("booking_type");

        if (commissionError) {
          console.error("Commission structure error:", commissionError);
          return NextResponse.json(
            { error: "Failed to fetch commission structure" },
            { status: 500 }
          );
        }

        return NextResponse.json({ commission_structure: commissionStructure });

      default:
        // Fetch leads with detailed information
        let leadsQuery = supabaseClient
          .from("leads_with_brand_details")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (profile.role === "brand_admin" && profile.owned_brands) {
          leadsQuery = leadsQuery.in("brand_id", profile.owned_brands);
        }

        if (brandId) {
          leadsQuery = leadsQuery.eq("brand_id", brandId);
        }

        if (status) {
          leadsQuery = leadsQuery.eq("status", status);
        }

        if (source) {
          leadsQuery = leadsQuery.eq("source", source);
        }

        const { data: leads, error: leadsError } = await leadsQuery;

        if (leadsError) {
          console.error("Leads error:", leadsError);
          return NextResponse.json(
            { error: "Failed to fetch leads" },
            { status: 500 }
          );
        }

        // Get total count for pagination
        let countQuery = supabaseClient
          .from("leads")
          .select("*", { count: "exact", head: true });

        if (profile.role === "brand_admin" && profile.owned_brands) {
          countQuery = countQuery.in("brand_id", profile.owned_brands);
        }

        if (brandId) {
          countQuery = countQuery.eq("brand_id", brandId);
        }

        if (status) {
          countQuery = countQuery.eq("status", status);
        }

        if (source) {
          countQuery = countQuery.eq("source", source);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error("Count error:", countError);
        }

        return NextResponse.json({
          leads,
          total: count || 0,
          limit,
          offset,
        });
    }
  } catch (error) {
    console.error("Error in leads GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/leads - Create new lead or booking
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await checkUserPermissions(user.id);

    if (
      !profile.role ||
      !["super_admin", "brand_admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "lead":
        // Create new lead
        const leadData: Lead = data;

        // Check if brand admin is trying to create lead for their brand
        if (profile.role === "brand_admin" && profile.owned_brands) {
          if (!profile.owned_brands.includes(leadData.brand_id)) {
            return NextResponse.json(
              { error: "Cannot create lead for this brand" },
              { status: 403 }
            );
          }
        }

        const { data: newLead, error: leadError } = await supabaseClient
          .from("leads")
          .insert([leadData])
          .select()
          .single();

        if (leadError) {
          console.error("Lead creation error:", leadError);
          return NextResponse.json(
            { error: "Failed to create lead" },
            { status: 500 }
          );
        }

        return NextResponse.json({ lead: newLead }, { status: 201 });

      case "booking":
        // Create new booking
        const bookingData: Booking = data;

        // Check if brand admin is trying to create booking for their brand
        if (profile.role === "brand_admin" && profile.owned_brands) {
          if (!profile.owned_brands.includes(bookingData.brand_id)) {
            return NextResponse.json(
              { error: "Cannot create booking for this brand" },
              { status: 403 }
            );
          }
        }

        // Get commission rate from commission structure if not provided
        if (!bookingData.commission_rate) {
          const { data: commissionData } = await supabase
            .from("commission_structure")
            .select("commission_rate")
            .eq("booking_type", bookingData.booking_type)
            .eq("is_active", true)
            .lte("min_booking_value", bookingData.booking_value)
            .gte("max_booking_value", bookingData.booking_value)
            .single();

          if (commissionData) {
            bookingData.commission_rate = commissionData.commission_rate;
          } else {
            // Fallback to default commission structure
            const { data: defaultCommission } = await supabase
              .from("commission_structure")
              .select("commission_rate")
              .eq("booking_type", bookingData.booking_type)
              .eq("is_active", true)
              .is("brand_id", null)
              .single();

            if (defaultCommission) {
              bookingData.commission_rate = defaultCommission.commission_rate;
            }
          }
        }

        const { data: newBooking, error: bookingError } = await supabaseClient
          .from("bookings")
          .insert([bookingData])
          .select()
          .single();

        if (bookingError) {
          console.error("Booking creation error:", bookingError);
          return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
          );
        }

        // Update financial metrics for the brand
        try {
          await supabase.rpc("update_brand_financial_metrics", {
            target_brand_id: bookingData.brand_id,
            target_month_year: new Date().toISOString().slice(0, 7) + "-01",
          });
        } catch (metricsError) {
          console.warn("Failed to update financial metrics:", metricsError);
        }

        return NextResponse.json({ booking: newBooking }, { status: 201 });

      case "interaction":
        // Add lead interaction
        const { lead_id, interaction_type, description } = data;

        const { data: newInteraction, error: interactionError } =
          await supabaseClient
            .from("lead_interactions")
            .insert([
              {
                lead_id,
                interaction_type,
                description,
                admin_id: user.id,
              },
            ])
            .select()
            .single();

        if (interactionError) {
          console.error("Interaction creation error:", interactionError);
          return NextResponse.json(
            { error: "Failed to create interaction" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { interaction: newInteraction },
          { status: 201 }
        );

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in leads POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/leads - Update lead or booking
export async function PUT(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await checkUserPermissions(user.id);

    if (
      !profile.role ||
      !["super_admin", "brand_admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, id, data } = body;

    switch (type) {
      case "lead":
        // Update lead
        const { data: updatedLead, error: leadError } = await supabaseClient
          .from("leads")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (leadError) {
          console.error("Lead update error:", leadError);
          return NextResponse.json(
            { error: "Failed to update lead" },
            { status: 500 }
          );
        }

        return NextResponse.json({ lead: updatedLead });

      case "booking":
        // Update booking
        const { data: updatedBooking, error: bookingError } =
          await supabaseClient
            .from("bookings")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (bookingError) {
          console.error("Booking update error:", bookingError);
          return NextResponse.json(
            { error: "Failed to update booking" },
            { status: 500 }
          );
        }

        // Update financial metrics if booking value or status changed
        if (data.booking_value || data.status) {
          const { data: booking } = await supabase
            .from("bookings")
            .select("brand_id, booking_date")
            .eq("id", id)
            .single();

          if (booking) {
            try {
              const monthYear =
                new Date(booking.booking_date).toISOString().slice(0, 7) +
                "-01";
              await supabase.rpc("update_brand_financial_metrics", {
                target_brand_id: booking.brand_id,
                target_month_year: monthYear,
              });
            } catch (metricsError) {
              console.warn("Failed to update financial metrics:", metricsError);
            }
          }
        }

        return NextResponse.json({ booking: updatedBooking });

      case "commission_structure":
        // Update commission structure (super admin only)
        if (profile.role !== "super_admin") {
          return NextResponse.json(
            { error: "Super admin access required" },
            { status: 403 }
          );
        }

        const { data: updatedCommission, error: commissionError } =
          await supabaseClient
            .from("commission_structure")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (commissionError) {
          console.error("Commission update error:", commissionError);
          return NextResponse.json(
            { error: "Failed to update commission structure" },
            { status: 500 }
          );
        }

        return NextResponse.json({ commission_structure: updatedCommission });

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in leads PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/leads - Delete lead or booking
export async function DELETE(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await checkUserPermissions(user.id);

    if (
      !profile.role ||
      !["super_admin", "brand_admin"].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "lead":
        // Delete lead (this will cascade to interactions)
        const { error: leadError } = await supabaseClient
          .from("leads")
          .delete()
          .eq("id", id);

        if (leadError) {
          console.error("Lead deletion error:", leadError);
          return NextResponse.json(
            { error: "Failed to delete lead" },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Lead deleted successfully" });

      case "booking":
        // Delete booking
        const { error: bookingError } = await supabaseClient
          .from("bookings")
          .delete()
          .eq("id", id);

        if (bookingError) {
          console.error("Booking deletion error:", bookingError);
          return NextResponse.json(
            { error: "Failed to delete booking" },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Booking deleted successfully" });

      case "interaction":
        // Delete interaction
        const { error: interactionError } = await supabaseClient
          .from("lead_interactions")
          .delete()
          .eq("id", id);

        if (interactionError) {
          console.error("Interaction deletion error:", interactionError);
          return NextResponse.json(
            { error: "Failed to delete interaction" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: "Interaction deleted successfully",
        });

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in leads DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
