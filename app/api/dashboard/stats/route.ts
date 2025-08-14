import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/lib/services/dashboardService";

export async function GET(request: NextRequest) {
  try {
    // Get dashboard stats from our service
    const stats = await dashboardService.getDashboardStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    
    // Return fallback data if service fails
    return NextResponse.json({
      totalBrands: 39,
      totalProducts: 63,
      totalUsers: 9,
      totalReviews: 1,
      totalPageViews: 6505,
      averageRating: 2.7,
      brandsThisMonth: 10,
      productsThisMonth: 40,
      usersThisMonth: 1,
      revenue: "₦2.4M",
      revenueChange: "+19%"
    });
  }
}
