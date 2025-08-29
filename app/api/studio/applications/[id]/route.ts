import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    console.log(`📝 Updating application ${id}:`, { status, notes });

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ["new", "reviewing", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Add review metadata if status is changing from new
    if (status !== "new") {
      updateData.reviewed_at = new Date().toISOString();
      // Note: reviewed_by would be set here if we had the current user context
      // For now, we'll leave it null and can enhance this later
    }

    // Update the application
    const { data: updatedApplication, error } = await supabase
      .from("designer_applications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    console.log(`✅ Application ${id} updated successfully to status: ${status}`);

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: "Application updated successfully"
    });

  } catch (error) {
    console.error("💥 Error in application update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
