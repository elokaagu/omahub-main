// Domain types for admin leads / bookings (shared by API route and clients)

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
  estimated_budget?: number;
  project_timeline?: string;
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
  top_performing_brands: unknown[];
  leads_by_source: Record<string, number>;
  bookings_by_type: Record<string, number>;
  monthly_trends: unknown[];
}
