import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function POST(request: NextRequest) {
  try {
    const {
      brandId,
      name,
      email,
      phone,
      source = "website",
      leadType = "inquiry",
      notes,
    } = await request.json();

    if (!brandId || !name || !email) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: brandId, name, and email are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Create the lead
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        brand_id: brandId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        source: source,
        lead_type: leadType,
        status: "new",
        priority: "normal",
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating lead:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create lead",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Lead created successfully:", lead.id);

    // Send email notification to brand's contact email
    try {
      // Get brand details to find contact email
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("name, contact_email")
        .eq("id", brandId)
        .single();

      if (!brandError && brand?.contact_email) {
        // Import and use the email service
        const { sendContactEmail } = await import(
          "@/lib/services/emailService"
        );

        const emailResult = await sendContactEmail({
          name: name,
          email: email,
          subject: `New Lead - ${name} is interested in your designs`,
          message: `You have a new lead from ${name} (${email}) who is interested in your designs.

Lead Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || "Not provided"}
- Source: ${source}
- Type: ${leadType}
- Notes: ${notes || "None"}

This lead has been saved to your Studio leads dashboard. You can view and manage all leads at: https://oma-hub.com/studio/leads

Best regards,
OmaHub Team`,
          to: brand.contact_email,
        });

        if (emailResult.success) {
          console.log(
            "✅ Lead notification email sent to brand:",
            brand.contact_email
          );
        } else {
          console.error(
            "❌ Failed to send lead notification email:",
            emailResult.error
          );
        }
      } else {
        console.log(
          "⚠️ Brand contact email not found, skipping email notification"
        );
      }
    } catch (emailError) {
      console.error("❌ Error sending lead notification email:", emailError);
      // Don't fail lead creation if email fails
    }

    return NextResponse.json({
      success: true,
      lead,
      message: "Lead captured successfully",
    });
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    console.log(
      `📊 GET leads request: action=${action}, page=${page}, limit=${limit}, status=${status}, source=${source}, priority=${priority}, search=${search}`
    );

    // Handle analytics action
    if (action === "analytics") {
      return await handleAnalyticsRequest(request);
    }

    // Handle commission action
    if (action === "commission") {
      return await handleCommissionRequest(request);
    }

    // Handle list action (for LeadsTrackingDashboard)
    if (action === "list") {
      return await handleListRequest(request);
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized leads fetch attempt");
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

    // Build query
    let query = supabase.from("leads").select(
      `
        *,
        brands(
          id,
          name,
          contact_email,
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
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (source && source !== "all") {
      query = query.eq("source", source);
    }
    if (priority && priority !== "all") {
      query = query.eq("priority", priority);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("❌ Error fetching leads:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${leads.length} leads (total: ${count})`);

    return NextResponse.json({
      success: true,
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("💥 Get leads error:", error);
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
      console.log("❌ Unauthorized delete attempt");
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

    // Delete any lead interactions first
    console.log("🗑️ Deleting lead interactions...");
    const { error: interactionsDeleteError } = await supabase
      .from("lead_interactions")
      .delete()
      .eq("lead_id", leadId);

    if (interactionsDeleteError) {
      console.warn(
        "⚠️ Warning: Could not delete interactions:",
        interactionsDeleteError.message
      );
      // Continue with lead deletion even if interactions fail
    } else {
      console.log("✅ Lead interactions deleted successfully");
    }

    // Delete the lead
    console.log("🗑️ Deleting lead from database...");
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

    console.log(`✅ Lead ${leadId} deleted successfully from database`);

    return NextResponse.json({
      success: true,
      message: `Lead ${existingLead.customer_name} deleted successfully`,
      deletedLeadId: leadId,
    });
  } catch (error) {
    console.error("💥 Delete lead error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json(
        {
          error: "Missing required fields: id and data are required",
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

    console.log(`✅ Lead ${id} updated successfully`);

    return NextResponse.json({
      success: true,
      message: `Lead ${existingLead.customer_name} updated successfully`,
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

// Handle analytics request
async function handleAnalyticsRequest(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized analytics request");
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

    // Build analytics query
    let query = supabase.from("leads").select(`
        id,
        status,
        created_at,
        estimated_value,
        brand_id
      `);

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

    const { data: leads, error } = await query;

    if (error) {
      console.error("❌ Error fetching analytics data:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // Calculate analytics with detailed logging
    const totalLeads = leads?.length || 0;
    const qualifiedLeads =
      leads?.filter((lead) => lead.status === "qualified").length || 0;
    const convertedLeads =
      leads?.filter((lead) => lead.status === "converted").length || 0;
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalValue =
      leads
        ?.filter((lead) => lead.estimated_value)
        .reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) || 0;

    // Log detailed analytics breakdown for debugging
    console.log("📊 Analytics calculation details:", {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalValue,
      leadStatuses: leads?.map(lead => ({ id: lead.id, status: lead.status })) || [],
      queryFilters: {
        role: profile.role,
        brandFilter: profile.role === "brand_admin" ? profile.owned_brands : "all"
      }
    });

    const analytics = {
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      converted_leads: convertedLeads,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      total_value: totalValue,
      total_bookings: convertedLeads, // Converted leads count as bookings
      leadsByStatus: {
        new: leads?.filter((lead) => lead.status === "new").length || 0,
        contacted:
          leads?.filter((lead) => lead.status === "contacted").length || 0,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: leads?.filter((lead) => lead.status === "lost").length || 0,
        closed: leads?.filter((lead) => lead.status === "closed").length || 0,
      },
    };

    console.log("✅ Analytics data calculated successfully:", analytics);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("💥 Analytics request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle commission request
async function handleCommissionRequest(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized commission request");
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

    // Check permissions - only super admin can access commission data
    if (profile.role !== "super_admin") {
      console.log("❌ Access denied for commission data, role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // For now, return empty commission structure
    // This can be expanded later when commission features are implemented
    const commissionStructure: any[] = [];

    console.log("✅ Commission data fetched successfully");

    return NextResponse.json({
      success: true,
      commissionStructure,
    });
  } catch (error) {
    console.error("💥 Commission request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle list request (for LeadsTrackingDashboard)
async function handleListRequest(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized list request");
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

    // Build query
    let query = supabase.from("leads").select(
      `
        *,
        brands(
          id,
          name,
          contact_email,
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

    // Apply sorting
    query = query.order("created_at", { ascending: false });

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("❌ Error fetching leads list:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads list" },
        { status: 500 }
      );
    }

    console.log(
      `✅ Leads list fetched successfully: ${leads?.length || 0} leads`
    );

    return NextResponse.json({
      success: true,
      leads: leads || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("💥 List request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
