import type { LeadsAdminProfile } from "@/lib/auth/requireLeadsAdmin";
import type { createServerSupabaseClient } from "@/lib/supabase-unified";

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export function brandAdminOwnsBrand(
  profile: LeadsAdminProfile,
  brandId: string
): boolean {
  if (profile.role === "super_admin") return true;
  return profile.owned_brands.includes(brandId);
}

const COMMISSION_FIELDS = ["commission_rate", "commission_amount"] as const;

/**
 * Commission is what brands owe OmaHub, so only super admins may set it.
 * Returns true when a non-super-admin tries to send commission fields.
 */
export function sendsCommissionWithoutPermission(
  profile: LeadsAdminProfile,
  data: Record<string, unknown>
): boolean {
  if (profile.role === "super_admin") return false;
  return COMMISSION_FIELDS.some((field) => data[field] !== undefined);
}

export async function fetchLeadBrandId(
  supabase: Supabase,
  leadId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("leads")
    .select("brand_id")
    .eq("id", leadId)
    .maybeSingle();
  return data?.brand_id ?? null;
}

export async function fetchBookingBrandId(
  supabase: Supabase,
  bookingId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("bookings")
    .select("brand_id")
    .eq("id", bookingId)
    .maybeSingle();
  return data?.brand_id ?? null;
}

/** Resolve brand for a lead_interactions row via its lead. */
export async function fetchInteractionLeadBrandId(
  supabase: Supabase,
  interactionId: string
): Promise<string | null> {
  const { data: interaction } = await supabase
    .from("lead_interactions")
    .select("lead_id")
    .eq("id", interactionId)
    .maybeSingle();
  if (!interaction?.lead_id) return null;
  return fetchLeadBrandId(supabase, interaction.lead_id);
}
