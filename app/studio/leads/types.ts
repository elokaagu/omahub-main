export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "closed";

export type LeadPriority = "low" | "normal" | "high";

/** Single normalized shape for the UI (API may return `brand` or `brands`). */
export type Lead = {
  id: string;
  customer_name: string;
  contact_email: string;
  contact_phone?: string;
  source: string;
  lead_type: string;
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  brand?: {
    id: string;
    name: string;
    category?: string;
  };
};

export type LeadStats = {
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_value: number;
  total_bookings: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    closed: number;
  };
};

export const EMPTY_LEAD_STATS: LeadStats = {
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
};

type LeadApiRow = Lead & {
  brands?: Lead["brand"];
};

export function normalizeLead(raw: LeadApiRow): Lead {
  const brand = raw.brand ?? raw.brands;
  return {
    id: raw.id,
    customer_name: raw.customer_name,
    contact_email: raw.contact_email,
    contact_phone: raw.contact_phone,
    source: raw.source,
    lead_type: raw.lead_type,
    status: raw.status,
    priority: raw.priority,
    estimated_value: raw.estimated_value,
    notes: raw.notes,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    brand: brand ?? undefined,
  };
}

export function normalizeLeads(rows: LeadApiRow[] | undefined): Lead[] {
  if (!rows?.length) return [];
  return rows.map(normalizeLead);
}
