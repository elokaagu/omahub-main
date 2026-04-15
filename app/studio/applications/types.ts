export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "approved",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type StatusFilter = ApplicationStatus | "all";

export function isApplicationStatus(v: string): v is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(v);
}

export function isStatusFilter(v: string): v is StatusFilter {
  return v === "all" || isApplicationStatus(v);
}

export interface DesignerApplication {
  id: string;
  brand_name: string;
  designer_name: string;
  email: string;
  phone?: string;
  website?: string;
  instagram?: string;
  location: string;
  category: string;
  description: string;
  year_founded?: number;
  status: ApplicationStatus;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  brand_id?: string | null;
  brand_verified?: boolean;
}
