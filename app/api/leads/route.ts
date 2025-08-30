import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function POST(request: NextRequest) {
  try {
    const { brandId, name, email, phone, source = 'website', leadType = 'inquiry', notes } = await request.json();
    
    if (!brandId || !name || !email) {
      return NextResponse.json({ 
        error: 'Missing required fields: brandId, name, and email are required' 
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Create the lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        brand_id: brandId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        source: source,
        lead_type: leadType,
        status: 'new',
        priority: 'normal',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating lead:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create lead',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Lead created successfully:', lead.id);

    return NextResponse.json({ 
      success: true, 
      lead,
      message: 'Lead captured successfully' 
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, owned_brands')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query based on user role
    let query = supabase.from('leads').select(`
      *,
      brand:brands(name, category, image)
    `).order('created_at', { ascending: false });

    // Apply role-based filtering
    if (profile.role === 'brand_admin' && profile.owned_brands?.length > 0) {
      query = query.in('brand_id', profile.owned_brands);
    }
    // Super admins can see all leads

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });

  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
