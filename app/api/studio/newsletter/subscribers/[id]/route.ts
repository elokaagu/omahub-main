import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log("📝 Updating newsletter subscriber:", id, body);

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Validate the update data
    const { subscription_status, preferences, notes } = body;
    
    if (subscription_status && !['active', 'unsubscribed', 'bounced', 'pending'].includes(subscription_status)) {
      return NextResponse.json(
        { error: "Invalid subscription status" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (subscription_status) {
      updateData.subscription_status = subscription_status;
      
      // Set unsubscribed_at if status is unsubscribed
      if (subscription_status === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString();
      } else {
        updateData.unsubscribed_at = null;
      }
    }

    if (preferences) {
      updateData.preferences = preferences;
    }

    // Update the subscriber
    const { data: updatedSubscriber, error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating subscriber:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscriber" },
        { status: 500 }
      );
    }

    console.log("✅ Subscriber updated successfully:", updatedSubscriber.id);

    return NextResponse.json({
      success: true,
      subscriber: updatedSubscriber,
      message: "Subscriber updated successfully"
    });

  } catch (error) {
    console.error("💥 Newsletter subscriber update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log("🗑️ Deleting newsletter subscriber:", id);

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Delete the subscriber
    const { error: deleteError } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Error deleting subscriber:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete subscriber" },
        { status: 500 }
      );
    }

    console.log("✅ Subscriber deleted successfully:", id);

    return NextResponse.json({
      success: true,
      message: "Subscriber deleted successfully"
    });

  } catch (error) {
    console.error("💥 Newsletter subscriber deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
