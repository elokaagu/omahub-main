import { NextRequest, NextResponse } from "next/server";
import { requireLeadsAdmin } from "@/lib/auth/requireLeadsAdmin";
import { computeFallbackLeadsAnalytics } from "@/lib/services/adminLeadsAnalytics";
import {
  brandAdminOwnsBrand,
  fetchBookingBrandId,
  fetchInteractionLeadBrandId,
  fetchLeadBrandId,
} from "@/lib/services/adminLeadsAccess";
import {
  normalizeBookingUpdatePatch,
  normalizeCommissionStructureUpdatePatch,
  normalizeLeadCreateForDb,
  normalizeLeadUpdatePatch,
  parseDeleteLeadsQuery,
  parseLeadsListQuery,
  postLeadsBodySchema,
  putLeadsBodySchema,
  sanitizeLeadSearch,
} from "@/lib/validation/adminLeads";

export type { Booking, Lead, LeadsAnalytics } from "@/lib/types/admin-leads";

function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

// GET /api/admin/leads - Fetch leads and analytics
export async function GET(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const { supabase, userId, profile } = auth.ctx;
    const { searchParams } = new URL(request.url);
    const parsedQuery = parseLeadsListQuery(searchParams);
    if (!parsedQuery.success) {
      return jsonValidationError(parsedQuery.error);
    }
    const q = parsedQuery.data;

    if (q.action === "analytics") {
      try {
        const { data: analyticsData, error: analyticsError } =
          await supabase.rpc("get_leads_analytics", {
            admin_user_id: userId,
          });

        if (analyticsError) {
          const fallback = await computeFallbackLeadsAnalytics(supabase, profile);
          if ("error" in fallback && fallback.error) {
            console.error("Admin leads analytics fallback failed:", fallback.error.message);
            return NextResponse.json(
              { error: "Failed to fetch analytics data" },
              { status: 500 }
            );
          }
          return NextResponse.json({ analytics: fallback });
        }

        const analytics = Array.isArray(analyticsData)
          ? analyticsData[0]
          : analyticsData;

        return NextResponse.json({ analytics });
      } catch (error) {
        console.error("Admin leads analytics error:", error);
        return NextResponse.json(
          { error: "Failed to fetch analytics" },
          { status: 500 }
        );
      }
    }

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const offset = (page - 1) * limit;
    const search = sanitizeLeadSearch(q.search);

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

    if (profile.role === "brand_admin") {
      if (profile.owned_brands.length === 0) {
        return NextResponse.json({
          leads: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        });
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    if (q.status) query = query.eq("status", q.status);
    if (q.source) query = query.eq("source", q.source);
    if (q.priority) query = query.eq("priority", q.priority);
    if (q.brandId) {
      if (
        profile.role === "brand_admin" &&
        !profile.owned_brands.includes(q.brandId)
      ) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      query = query.eq("brand_id", q.brandId);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("Admin leads list error:", fetchError.code, fetchError.message);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const mappedLeads =
      leads?.map((lead: Record<string, unknown>) => {
        const mappedLead = { ...lead };
        if (mappedLead.project_timeline) {
          mappedLead.timeline = mappedLead.project_timeline;
        }
        return mappedLead;
      }) || [];

    return NextResponse.json({
      leads: mappedLeads,
      totalCount: count || 0,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Admin leads GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/leads - Create new lead or booking
export async function POST(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const { supabase, userId, profile } = auth.ctx;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = postLeadsBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    switch (parsed.data.type) {
      case "lead": {
        const leadData = normalizeLeadCreateForDb(parsed.data.data);
        if (!brandAdminOwnsBrand(profile, leadData.brand_id)) {
          return NextResponse.json(
            { error: "Cannot create lead for this brand" },
            { status: 403 }
          );
        }

        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert([leadData])
          .select()
          .single();

        if (leadError) {
          console.error("Lead creation error:", leadError.code, leadError.message);
          return NextResponse.json(
            { error: "Failed to create lead" },
            { status: 500 }
          );
        }

        return NextResponse.json({ lead: newLead }, { status: 201 });
      }

      case "booking": {
        let bookingData = parsed.data.data;

        if (!brandAdminOwnsBrand(profile, bookingData.brand_id)) {
          return NextResponse.json(
            { error: "Cannot create booking for this brand" },
            { status: 403 }
          );
        }

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
            bookingData = {
              ...bookingData,
              commission_rate: commissionData.commission_rate,
            };
          } else {
            const { data: defaultCommission } = await supabase
              .from("commission_structure")
              .select("commission_rate")
              .eq("booking_type", bookingData.booking_type)
              .eq("is_active", true)
              .is("brand_id", null)
              .single();

            if (defaultCommission) {
              bookingData = {
                ...bookingData,
                commission_rate: defaultCommission.commission_rate,
              };
            }
          }
        }

        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert([bookingData])
          .select()
          .single();

        if (bookingError) {
          console.error("Booking creation error:", bookingError.code, bookingError.message);
          return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
          );
        }

        try {
          await supabase.rpc("update_brand_financial_metrics", {
            target_brand_id: bookingData.brand_id,
            target_month_year: new Date().toISOString().slice(0, 7) + "-01",
          });
        } catch (metricsError) {
          console.warn("update_brand_financial_metrics failed:", metricsError);
        }

        return NextResponse.json({ booking: newBooking }, { status: 201 });
      }

      case "interaction": {
        const { lead_id, interaction_type, description } = parsed.data.data;

        const leadBrandId = await fetchLeadBrandId(supabase, lead_id);
        if (!leadBrandId) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }
        if (!brandAdminOwnsBrand(profile, leadBrandId)) {
          return NextResponse.json(
            { error: "Cannot add interaction for this lead" },
            { status: 403 }
          );
        }

        const { data: newInteraction, error: interactionError } = await supabase
          .from("lead_interactions")
          .insert([
            {
              lead_id,
              interaction_type,
              description,
              admin_id: userId,
            },
          ])
          .select()
          .single();

        if (interactionError) {
          console.error(
            "Interaction creation error:",
            interactionError.code,
            interactionError.message
          );
          return NextResponse.json(
            { error: "Failed to create interaction" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { interaction: newInteraction },
          { status: 201 }
        );
      }

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin leads POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/leads - Update lead or booking
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const { supabase, profile } = auth.ctx;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = putLeadsBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const payload = parsed.data;

    switch (payload.type) {
      case "lead": {
        const patch = normalizeLeadUpdatePatch(payload.data);
        if (Object.keys(patch).length === 0) {
          return NextResponse.json(
            { error: "At least one field is required to update" },
            { status: 400 }
          );
        }

        const brandId = await fetchLeadBrandId(supabase, payload.id);
        if (!brandId) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }
        if (!brandAdminOwnsBrand(profile, brandId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { data: updatedLead, error: leadError } = await supabase
          .from("leads")
          .update(patch)
          .eq("id", payload.id)
          .select()
          .single();

        if (leadError) {
          console.error("Lead update error:", leadError.code, leadError.message);
          return NextResponse.json(
            { error: `Failed to update lead: ${leadError.message}` },
            { status: 500 }
          );
        }

        const responseData = { ...updatedLead };
        if (responseData.project_timeline) {
          (responseData as { timeline?: string }).timeline =
            responseData.project_timeline;
        }

        return NextResponse.json({ lead: responseData });
      }

      case "booking": {
        const patch = normalizeBookingUpdatePatch(payload.data);
        if (Object.keys(patch).length === 0) {
          return NextResponse.json(
            { error: "At least one field is required to update" },
            { status: 400 }
          );
        }

        const brandId = await fetchBookingBrandId(supabase, payload.id);
        if (!brandId) {
          return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (!brandAdminOwnsBrand(profile, brandId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { data: updatedBooking, error: bookingError } = await supabase
          .from("bookings")
          .update(patch)
          .eq("id", payload.id)
          .select()
          .single();

        if (bookingError) {
          console.error("Booking update error:", bookingError.code, bookingError.message);
          return NextResponse.json(
            { error: "Failed to update booking" },
            { status: 500 }
          );
        }

        if ("booking_value" in patch || "status" in patch) {
          const { data: booking } = await supabase
            .from("bookings")
            .select("brand_id, booking_date")
            .eq("id", payload.id)
            .single();

          if (booking?.brand_id) {
            try {
              const monthYear =
                new Date(booking.booking_date).toISOString().slice(0, 7) + "-01";
              await supabase.rpc("update_brand_financial_metrics", {
                target_brand_id: booking.brand_id,
                target_month_year: monthYear,
              });
            } catch (metricsError) {
              console.warn("update_brand_financial_metrics failed:", metricsError);
            }
          }
        }

        return NextResponse.json({ booking: updatedBooking });
      }

      case "commission_structure": {
        if (profile.role !== "super_admin") {
          return NextResponse.json(
            { error: "Super admin access required" },
            { status: 403 }
          );
        }

        const patch = normalizeCommissionStructureUpdatePatch(payload.data);
        if (Object.keys(patch).length === 0) {
          return NextResponse.json(
            { error: "At least one field is required to update" },
            { status: 400 }
          );
        }

        const { data: updatedCommission, error: commissionError } =
          await supabase
            .from("commission_structure")
            .update(patch)
            .eq("id", payload.id)
            .select()
            .single();

        if (commissionError) {
          console.error(
            "Commission update error:",
            commissionError.code,
            commissionError.message
          );
          return NextResponse.json(
            { error: "Failed to update commission structure" },
            { status: 500 }
          );
        }

        return NextResponse.json({ commission_structure: updatedCommission });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin leads PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/leads - Delete lead or booking
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireLeadsAdmin();
    if (!auth.ok) return auth.response;

    const { supabase, profile } = auth.ctx;

    const parsed = parseDeleteLeadsQuery(new URL(request.url).searchParams);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { type, id } = parsed.data;

    switch (type) {
      case "lead": {
        const brandId = await fetchLeadBrandId(supabase, id);
        if (!brandId) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }
        if (!brandAdminOwnsBrand(profile, brandId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { error: leadError } = await supabase
          .from("leads")
          .delete()
          .eq("id", id);

        if (leadError) {
          console.error("Lead deletion error:", leadError.code, leadError.message);
          return NextResponse.json(
            { error: "Failed to delete lead" },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Lead deleted successfully" });
      }

      case "booking": {
        const brandId = await fetchBookingBrandId(supabase, id);
        if (!brandId) {
          return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (!brandAdminOwnsBrand(profile, brandId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { error: bookingError } = await supabase
          .from("bookings")
          .delete()
          .eq("id", id);

        if (bookingError) {
          console.error("Booking deletion error:", bookingError.code, bookingError.message);
          return NextResponse.json(
            { error: "Failed to delete booking" },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Booking deleted successfully" });
      }

      case "interaction": {
        const brandId = await fetchInteractionLeadBrandId(supabase, id);
        if (!brandId) {
          return NextResponse.json(
            { error: "Interaction not found" },
            { status: 404 }
          );
        }
        if (!brandAdminOwnsBrand(profile, brandId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { error: interactionError } = await supabase
          .from("lead_interactions")
          .delete()
          .eq("id", id);

        if (interactionError) {
          console.error(
            "Interaction deletion error:",
            interactionError.code,
            interactionError.message
          );
          return NextResponse.json(
            { error: "Failed to delete interaction" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: "Interaction deleted successfully",
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin leads DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
