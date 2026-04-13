import { NextRequest, NextResponse } from "next/server";
import type { LeadsAdminContext } from "@/lib/auth/requireLeadsAdmin";
import { computeFallbackLeadsAnalytics } from "@/lib/services/adminLeadsAnalytics";
import {
  brandAdminOwnsBrand,
  fetchBookingBrandId,
  fetchInteractionLeadBrandId,
  fetchLeadBrandId,
} from "@/lib/services/adminLeadsAccess";
import {
  deleteAdminLeadQuerySchema,
  normalizeBookingUpdatePatch,
  normalizeCommissionStructureUpdatePatch,
  normalizeLeadCreateForDb,
  normalizeLeadUpdatePatch,
  parseDeleteAdminEntityQuery,
  parseDeleteAdminLeadQuery,
  parseLeadsListQuery,
  postAdminBookingBodySchema,
  postAdminLeadBodySchema,
  postAdminLeadInteractionBodySchema,
  putAdminBookingBodySchema,
  putAdminCommissionStructureBodySchema,
  putAdminLeadBodySchema,
  sanitizeLeadSearch,
} from "@/lib/validation/adminLeads";

export function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

export async function handleLeadsAnalyticsGET(
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, userId, profile } = ctx;
  try {
    const { data: analyticsData, error: analyticsError } =
      await supabase.rpc("get_leads_analytics", {
        admin_user_id: userId,
      });

    if (analyticsError) {
      const fallback = await computeFallbackLeadsAnalytics(supabase, profile);
      if ("error" in fallback && fallback.error) {
        console.error(
          "Admin leads analytics fallback failed:",
          fallback.error.message
        );
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

export async function handleLeadsListGET(
  request: NextRequest,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsedQuery = parseLeadsListQuery(new URL(request.url).searchParams);
  if (!parsedQuery.success) {
    return jsonValidationError(parsedQuery.error);
  }
  const q = parsedQuery.data;

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
}

export async function handlePostLead(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = postAdminLeadBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  const leadData = normalizeLeadCreateForDb(parsed.data);
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
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }

  return NextResponse.json({ lead: newLead }, { status: 201 });
}

async function resolveBookingCommission(
  supabase: LeadsAdminContext["supabase"],
  bookingData: Record<string, unknown>
) {
  let next = { ...bookingData } as Record<string, unknown>;
  if (!next.commission_rate) {
    const { data: commissionData } = await supabase
      .from("commission_structure")
      .select("commission_rate")
      .eq("booking_type", next.booking_type as string)
      .eq("is_active", true)
      .lte("min_booking_value", next.booking_value as number)
      .gte("max_booking_value", next.booking_value as number)
      .single();

    if (commissionData) {
      next = { ...next, commission_rate: commissionData.commission_rate };
    } else {
      const { data: defaultCommission } = await supabase
        .from("commission_structure")
        .select("commission_rate")
        .eq("booking_type", next.booking_type as string)
        .eq("is_active", true)
        .is("brand_id", null)
        .single();

      if (defaultCommission) {
        next = { ...next, commission_rate: defaultCommission.commission_rate };
      }
    }
  }
  return next;
}

export async function handlePostBooking(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = postAdminBookingBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  let bookingData = await resolveBookingCommission(supabase, parsed.data);

  if (!brandAdminOwnsBrand(profile, bookingData.brand_id as string)) {
    return NextResponse.json(
      { error: "Cannot create booking for this brand" },
      { status: 403 }
    );
  }

  const rpcPayload = {
    in_lead_id: (bookingData.lead_id as string | undefined) ?? null,
    in_brand_id: bookingData.brand_id as string,
    in_customer_name: bookingData.customer_name as string,
    in_customer_email: bookingData.customer_email as string,
    in_customer_phone: (bookingData.customer_phone as string | undefined) ?? null,
    in_booking_type: bookingData.booking_type as string,
    in_status: (bookingData.status as string) ?? "confirmed",
    in_booking_value: bookingData.booking_value as number,
    in_commission_rate: (bookingData.commission_rate as number | undefined) ?? null,
    in_commission_amount: (bookingData.commission_amount as number | undefined) ?? null,
    in_currency: (bookingData.currency as string | undefined) ?? "USD",
    in_booking_date: bookingData.booking_date
      ? (bookingData.booking_date as string)
      : null,
    in_delivery_date: (bookingData.delivery_date as string | undefined) ?? null,
    in_completion_date: (bookingData.completion_date as string | undefined) ?? null,
    in_notes: (bookingData.notes as string | undefined) ?? null,
  };

  const { data: rpcBooking, error: rpcError } = await supabase.rpc(
    "insert_booking_and_refresh_metrics",
    rpcPayload
  );

  if (!rpcError && rpcBooking) {
    const row = Array.isArray(rpcBooking) ? rpcBooking[0] : rpcBooking;
    return NextResponse.json({ booking: row }, { status: 201 });
  }

  if (rpcError) {
    console.warn(
      "insert_booking_and_refresh_metrics unavailable or failed, using fallback:",
      rpcError.code,
      rpcError.message
    );
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
      target_month_year:
        new Date(
          (newBooking as { booking_date?: string }).booking_date ??
            new Date().toISOString()
        )
          .toISOString()
          .slice(0, 7) + "-01",
    });
  } catch (metricsError) {
    console.warn("update_brand_financial_metrics failed:", metricsError);
  }

  return NextResponse.json({ booking: newBooking }, { status: 201 });
}

export async function handlePostInteraction(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, userId, profile } = ctx;
  const parsed = postAdminLeadInteractionBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  const { lead_id, interaction_type, description } = parsed.data;

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

  return NextResponse.json({ interaction: newInteraction }, { status: 201 });
}

export async function handlePutLead(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = putAdminLeadBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  const { id, data } = parsed.data;
  const patch = normalizeLeadUpdatePatch(data);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "At least one field is required to update" },
      { status: 400 }
    );
  }

  const brandId = await fetchLeadBrandId(supabase, id);
  if (!brandId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (!brandAdminOwnsBrand(profile, brandId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { data: updatedLead, error: leadError } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (leadError) {
    console.error("Lead update error:", leadError.code, leadError.message);
    return NextResponse.json(
      { error: "Failed to update lead" },
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

export async function handlePutBooking(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = putAdminBookingBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  const { id, data } = parsed.data;
  const patch = normalizeBookingUpdatePatch(data);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "At least one field is required to update" },
      { status: 400 }
    );
  }

  const brandId = await fetchBookingBrandId(supabase, id);
  if (!brandId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!brandAdminOwnsBrand(profile, brandId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { data: updatedBooking, error: bookingError } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", id)
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
    const { error: refreshErr } = await supabase.rpc(
      "refresh_booking_financial_metrics",
      { p_booking_id: id }
    );
    if (refreshErr) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("brand_id, booking_date")
        .eq("id", id)
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
  }

  return NextResponse.json({ booking: updatedBooking });
}

export async function handlePutCommissionStructure(
  body: unknown,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  if (profile.role !== "super_admin") {
    return NextResponse.json(
      { error: "Super admin access required" },
      { status: 403 }
    );
  }

  const parsed = putAdminCommissionStructureBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }

  const { id, data } = parsed.data;
  const patch = normalizeCommissionStructureUpdatePatch(data);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "At least one field is required to update" },
      { status: 400 }
    );
  }

  const { data: updatedCommission, error: commissionError } = await supabase
    .from("commission_structure")
    .update(patch)
    .eq("id", id)
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

export async function handleDeleteLead(
  searchParams: URLSearchParams,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = parseDeleteAdminLeadQuery(searchParams);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }
  const { id } = parsed.data;

  const brandId = await fetchLeadBrandId(supabase, id);
  if (!brandId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (!brandAdminOwnsBrand(profile, brandId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { error: leadError } = await supabase.from("leads").delete().eq("id", id);

  if (leadError) {
    console.error("Lead deletion error:", leadError.code, leadError.message);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }

  return NextResponse.json({ message: "Lead deleted successfully" });
}

export async function handleDeleteBooking(
  searchParams: URLSearchParams,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = parseDeleteAdminEntityQuery(searchParams);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }
  const { id } = parsed.data;

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

export async function handleDeleteInteraction(
  searchParams: URLSearchParams,
  ctx: LeadsAdminContext
): Promise<NextResponse> {
  const { supabase, profile } = ctx;
  const parsed = parseDeleteAdminEntityQuery(searchParams);
  if (!parsed.success) {
    return jsonValidationError(parsed.error);
  }
  const { id } = parsed.data;

  const brandId = await fetchInteractionLeadBrandId(supabase, id);
  if (!brandId) {
    return NextResponse.json({ error: "Interaction not found" }, { status: 404 });
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

  return NextResponse.json({ message: "Interaction deleted successfully" });
}
