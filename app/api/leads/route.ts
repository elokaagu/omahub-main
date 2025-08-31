import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      name,
      email,
      phone,
      source,
      leadType,
      notes,
      estimatedValue,
      priority = "normal",
    } = body;

    if (!brandId || !name || !email || !source || !leadType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📝 Creating new lead:", { name, email, source, leadType, brandId });

    const supabase = await createServerSupabaseClient();

    // First, verify the brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, contact_email")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      console.error("❌ Brand not found:", brandId, brandError);
      return NextResponse.json(
        { 
          error: "Invalid brand ID. The specified brand does not exist.",
          details: `Brand ID '${brandId}' not found in database`
        }, 
        { status: 400 }
      );
    }

    console.log("✅ Brand verified:", brand.name);

    // Create the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        brand_id: brandId,
        customer_name: name,
        contact_email: email,
        contact_phone: phone,
        source,
        lead_type: leadType,
        notes,
        estimated_value: estimatedValue,
        priority,
        status: "new",
      })
      .select()
      .single();

    if (leadError) {
      console.error("❌ Error creating lead:", leadError);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }

    // Send email notification to brand
    try {
      if (brand?.contact_email) {
        const emailResponse = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: brand.contact_email,
            subject: `New Lead: ${name} - ${source}`,
            template: "new-lead",
            data: {
              brandName: brand.name,
              customerName: name,
              customerEmail: email,
              source,
              leadType,
              notes,
            },
          }),
        });

        if (!emailResponse.ok) {
          console.warn("⚠️ Failed to send email notification");
        }
      }
    } catch (emailError) {
      console.warn("⚠️ Email notification failed:", emailError);
    }

    console.log("✅ Lead created successfully:", lead.id);
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("💥 Create lead error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    console.log(
      `📊 GET leads request: action=${action}, page=${page}, limit=${limit}`
    );

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized leads access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Handle analytics request
    if (action === "analytics") {
      return handleAnalyticsRequest(supabase, profile);
    }

    // Handle commission request
    if (action === "commission") {
      return handleCommissionRequest(supabase, profile);
    }

    // Handle list request (default)
    return handleListRequest(supabase, profile, {
      page,
      limit,
      status,
      source,
      priority,
      search,
    });
  } catch (error) {
    console.error("💥 Get leads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleAnalyticsRequest(supabase: any, profile: any) {
  try {
    let query = supabase
      .from("leads")
      .select(`id, status, created_at, estimated_value, brand_id`);

    // Apply role-based filtering
    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      console.log(
        "🔍 Filtering analytics by owned brands:",
        profile.owned_brands
      );
      query = query.in("brand_id", profile.owned_brands);
    } else if (profile.role === "brand_admin") {
      console.log("⚠️ Brand admin has no accessible brands for analytics");
      return NextResponse.json({
        success: true,
        analytics: {
          total_leads: 0,
          qualified_leads: 0,
          converted_leads: 0,
          conversion_rate: 0,
          total_value: 0,
          total_bookings: 0,
          leadsByStatus: {
            new: 0,
            contacted: 0,
            qualified: 0,
            converted: 0,
            lost: 0,
            closed: 0,
          },
        },
      });
    } else {
      console.log("🔍 Super admin - no brand filtering for analytics");
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("❌ Error fetching leads for analytics:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    console.log("📊 Analytics calculation details:", {
      userRole: profile.role,
      ownedBrands:
        profile.role === "brand_admin" ? profile.owned_brands : "N/A",
      totalLeads: leads?.length || 0,
    });

    const totalLeads = leads?.length || 0;
    const qualifiedLeads =
      leads?.filter((lead: any) => lead.status === "qualified").length || 0;
    const convertedLeads =
      leads?.filter((lead: any) => lead.status === "converted").length || 0;
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalValue =
      leads
        ?.filter((lead: any) => lead.estimated_value)
        .reduce(
          (sum: number, lead: any) => sum + (lead.estimated_value || 0),
          0
        ) || 0;

    const analytics = {
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      converted_leads: convertedLeads,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      total_value: totalValue,
      total_bookings: convertedLeads, // Converted leads count as bookings
      leadsByStatus: {
        new: leads?.filter((lead: any) => lead.status === "new").length || 0,
        contacted:
          leads?.filter((lead: any) => lead.status === "contacted").length || 0,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: leads?.filter((lead: any) => lead.status === "lost").length || 0,
        closed:
          leads?.filter((lead: any) => lead.status === "closed").length || 0,
      },
    };

    console.log(`🔍 Analytics query details:`, {
      userRole: profile.role,
      ownedBrands:
        profile.role === "brand_admin" ? profile.owned_brands : "N/A",
      leadsReturned: leads?.length || 0,
      analytics,
    });

    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error("💥 Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to calculate analytics" },
      { status: 500 }
    );
  }
}

async function handleCommissionRequest(supabase: any, profile: any) {
  try {
    let query = supabase
      .from("leads")
      .select(
        `
        id,
        status,
        created_at,
        estimated_value,
        brand_id,
        brand:brands(name, commission_rate)
      `
      )
      .eq("status", "converted");

    // Apply role-based filtering
    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      query = query.in("brand_id", profile.owned_brands);
    }

    const { data: convertedLeads, error } = await query;

    if (error) {
      console.error("❌ Error fetching converted leads for commission:", error);
      return NextResponse.json(
        { error: "Failed to fetch commission data" },
        { status: 500 }
      );
    }

    const commissionData =
      convertedLeads?.map((lead: any) => ({
        leadId: lead.id,
        brandName: lead.brand?.name || "Unknown Brand",
        estimatedValue: lead.estimated_value || 0,
        commissionRate: lead.brand?.commission_rate || 0,
        commissionAmount:
          ((lead.estimated_value || 0) * (lead.brand?.commission_rate || 0)) /
          100,
        convertedAt: lead.created_at,
      })) || [];

    const totalCommission = commissionData.reduce(
      (sum: number, item: any) => sum + item.commissionAmount,
      0
    );

    return NextResponse.json({
      success: true,
      commission: {
        totalCommission,
        convertedLeads: commissionData,
        summary: {
          totalLeads: commissionData.length,
          totalValue: commissionData.reduce(
            (sum: number, item: any) => sum + item.estimatedValue,
            0
          ),
          averageCommissionRate:
            commissionData.length > 0
              ? commissionData.reduce(
                  (sum: number, item: any) => sum + item.commissionRate,
                  0
                ) / commissionData.length
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("💥 Commission error:", error);
    return NextResponse.json(
      { error: "Failed to calculate commission" },
      { status: 500 }
    );
  }
}

async function handleListRequest(supabase: any, profile: any, filters: any) {
  try {
    let query = supabase.from("leads").select(
      `
        *,
        brands(
          id,
          name,
          category
        )
      `,
      { count: "exact" }
    );

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.log("❌ Brand admin has no accessible brands");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    // Apply filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.source && filters.source !== "all") {
      query = query.eq("source", filters.source);
    }
    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      );
    }

    // Apply pagination and sorting
    const offset = (filters.page - 1) * filters.limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + filters.limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("❌ Error fetching leads:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${leads?.length || 0} leads (total: ${count})`);
    console.log(`🔍 Query details:`, {
      userRole: profile.role,
      ownedBrands:
        profile.role === "brand_admin" ? profile.owned_brands : "N/A",
      leadsReturned: leads?.length || 0,
      totalCount: count,
    });

    return NextResponse.json({
      success: true,
      leads: leads || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error) {
    console.error("💥 List leads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("📝 PUT request received for leads API");
    
    // Log the raw request details
    console.log("🔍 Request details:", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });

    const body = await request.json();
    console.log("📦 Request body received:", body);
    
    const { id, data } = body;
    console.log("🔍 Extracted fields:", { id, data });

    if (!id || !data) {
      console.error("❌ Missing required fields:", { id: !!id, data: !!data, body });
      return NextResponse.json(
        {
          error: "Missing required fields: id and data are required",
          received: { id: !!id, data: !!data, bodyKeys: Object.keys(body || {}) },
        },
        { status: 400 }
      );
    }

    console.log(`📝 PUT request for lead: ${id}`, data);

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized lead update attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify lead exists and user has access
    let verifyQuery = supabase
      .from("leads")
      .select("id, brand_id, customer_name")
      .eq("id", id);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.log("❌ Brand admin has no accessible brands");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: existingLead, error: verifyError } =
      await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        console.log("❌ Lead not found:", id);
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      console.error("❌ Error verifying lead:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify lead" },
        { status: 500 }
      );
    }

    console.log(`✅ Lead verified for update: ${existingLead.customer_name}`);

    // Update the lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Failed to update lead:", updateError);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    console.log(`✅ Lead updated successfully: ${updatedLead.customer_name}`);

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("💥 Update lead error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("id");

    if (!leadId) {
      return NextResponse.json(
        {
          error: "Lead ID is required",
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ DELETE request for lead: ${leadId}`);

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized lead deletion attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // First, check if the lead exists
    let verifyQuery = supabase
      .from("leads")
      .select("id, brand_id, customer_name")
      .eq("id", leadId);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.log("❌ Brand admin has no accessible brands");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: existingLead, error: verifyError } =
      await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        console.log("❌ Lead not found:", leadId);
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      console.error("❌ Error verifying lead:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify lead" },
        { status: 500 }
      );
    }

    console.log(`✅ Lead verified for deletion: ${existingLead.customer_name}`);

    // Delete associated lead interactions first
    console.log("🗑️ Deleting associated lead interactions...");
    const { error: interactionsError } = await supabase
      .from("lead_interactions")
      .delete()
      .eq("lead_id", leadId);

    if (interactionsError) {
      console.warn(
        "⚠️ Warning: Failed to delete lead interactions:",
        interactionsError
      );
    } else {
      console.log("✅ Lead interactions deleted successfully");
    }

    // Delete the lead
    console.log("🗑️ Deleting lead...");
    const { error: deleteError } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (deleteError) {
      console.error("❌ Failed to delete lead:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete lead" },
        { status: 500 }
      );
    }

    console.log(`✅ Lead deleted successfully: ${existingLead.customer_name}`);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("💥 Delete lead error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
