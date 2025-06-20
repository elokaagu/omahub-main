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
    const supabase = createRouteHandlerClient({ cookies });

    // Enhanced authentication with better error handling
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { error: "Session invalid - please sign in again" },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session or user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    console.log("✅ Leads API: User authenticated:", user.email);

    // Get user profile with fallback for super_admin users
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access
      if (
        user.email === "eloka.agu@icloud.com" ||
        user.email === "shannonalisa@oma-hub.com"
      ) {
        profile = {
          role: "super_admin",
          owned_brands: [],
        };
        console.log(
          "✅ Granted super_admin access based on email:",
          user.email
        );
      } else {
        console.error("Profile error:", profileError);
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    } else {
      profile = profileData;
    }

    // Check if user has admin access
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("✅ Access granted for role:", profile.role);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "analytics") {
      try {
        console.log("📊 Fetching analytics data...");

        // Call the analytics function
        const { data: analyticsData, error: analyticsError } =
          await supabase.rpc("get_leads_analytics");

        if (analyticsError) {
          console.error("Analytics function error:", analyticsError);

          // Fallback to basic analytics if function fails
          console.log(
            "⚠️ Analytics function failed, using fallback calculation"
          );

          const { data: leads, error: leadsError } = await supabase
            .from("leads")
            .select("*");

          if (leadsError) {
            console.error("Fallback leads query error:", leadsError);
            return NextResponse.json(
              { error: "Failed to fetch analytics data" },
              { status: 500 }
            );
          }

          // Calculate basic analytics
          const totalLeads = leads?.length || 0;
          const thisMonthLeads =
            leads?.filter((lead) => {
              const leadDate = new Date(lead.created_at);
              const now = new Date();
              return (
                leadDate.getMonth() === now.getMonth() &&
                leadDate.getFullYear() === now.getFullYear()
              );
            }).length || 0;

          const fallbackData = {
            total_leads: totalLeads,
            this_month_leads: thisMonthLeads,
            this_month_bookings: 0,
            this_month_revenue: 0,
            this_month_commission: 0,
            total_commission_earned: 0,
            average_booking_value: 0,
            conversion_rate:
              totalLeads > 0 ? ((0 / totalLeads) * 100).toFixed(1) : "0.0",
            top_performing_brands: [],
            leads_by_source: {
              website: 0,
              instagram: 0,
              referral: 0,
              whatsapp: 0,
              other: 0,
            },
            bookings_by_type: {
              consultation: 0,
              service: 0,
              product: 0,
              other: 0,
            },
            monthly_trends: [],
          };

          console.log("✅ Returning fallback analytics data");
          return NextResponse.json(fallbackData);
        }

        console.log("✅ Analytics data fetched successfully");
        return NextResponse.json(analyticsData);
      } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
          { error: "Failed to fetch analytics" },
          { status: 500 }
        );
      }
    }

    // Default: Fetch leads list
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const priority = searchParams.get("priority");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("leads").select(
      `
        *,
        brands:brand_id (
          name,
          category,
          image
        )
      `,
      { count: "exact" }
    );

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json({
          leads: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        });
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (source) {
      query = query.eq("source", source);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ Fetched ${leads?.length || 0} leads for ${user.email}`);

    return NextResponse.json({
      leads: leads || [],
      totalCount: count || 0,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Leads API error:", error);
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
