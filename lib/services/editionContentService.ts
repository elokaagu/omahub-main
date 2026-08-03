import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Edition, EditionStatus } from "@/lib/data/editions";

export type EditionContentRecord = {
  edition_slug: string;
  title: string | null;
  card_title: string | null;
  excerpt: string | null;
  story_html: string | null;
  status: EditionStatus | null;
  date_label: string | null;
  sort_date: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  partner: string | null;
  lineup_label: string | null;
  applications_open: boolean | null;
  theme_announced: boolean | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EditionContentInput = {
  title?: string;
  card_title?: string;
  excerpt?: string;
  story_html?: string;
  status?: EditionStatus;
  date_label?: string;
  sort_date?: string;
  city?: string;
  country?: string;
  venue?: string | null;
  partner?: string | null;
  lineup_label?: string | null;
  applications_open?: boolean;
  theme_announced?: boolean;
};

async function assertSuperAdmin(
  userId: string,
  client: SupabaseClient,
): Promise<void> {
  const { data: profile, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Permission check failed: ${error.message}`);
  if (profile?.role !== "super_admin") {
    throw new Error("Permission denied: Only super admins can manage editions");
  }
}

export async function getEditionContent(
  editionSlug: string,
  client?: SupabaseClient,
): Promise<EditionContentRecord | null> {
  const db = client ?? supabase;
  if (!db) return null;

  const { data, error } = await db
    .from("edition_content")
    .select("*")
    .eq("edition_slug", editionSlug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching edition content:", error);
    return null;
  }

  return data;
}

export async function getAllEditionContent(): Promise<EditionContentRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("edition_content")
    .select("*")
    .order("sort_date", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Error fetching all edition content:", error);
    return [];
  }

  return data ?? [];
}

export async function upsertEditionContent(
  userId: string,
  editionSlug: string,
  input: EditionContentInput,
  client?: SupabaseClient,
): Promise<EditionContentRecord> {
  const db = client ?? supabase;
  if (!db) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId, db);

  const payload = {
    edition_slug: editionSlug,
    ...input,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("edition_content")
    .upsert(payload, { onConflict: "edition_slug" })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}

/** Merge static edition seed data with optional Studio overrides. */
export function mergeEditionWithContent(
  staticEdition: Edition,
  content: EditionContentRecord | null,
): Edition & { storyHtml?: string | null } {
  if (!content) {
    return { ...staticEdition, storyHtml: null };
  }

  return {
    ...staticEdition,
    title: content.title ?? staticEdition.title,
    cardTitle: content.card_title ?? staticEdition.cardTitle,
    excerpt: content.excerpt ?? staticEdition.excerpt,
    story: staticEdition.story,
    storyHtml: content.story_html,
    status: content.status ?? staticEdition.status,
    dateLabel: content.date_label ?? staticEdition.dateLabel,
    sortDate: content.sort_date ?? staticEdition.sortDate,
    city: content.city ?? staticEdition.city,
    country: content.country ?? staticEdition.country,
    venue: content.venue ?? staticEdition.venue,
    partner: content.partner ?? staticEdition.partner,
    lineupLabel: content.lineup_label ?? staticEdition.lineupLabel,
    applicationsOpen:
      content.applications_open ?? staticEdition.applicationsOpen,
    themeAnnounced: content.theme_announced ?? staticEdition.themeAnnounced,
  };
}

/** Form defaults for the Studio editor — static seed + any saved overrides. */
export function buildEditionEditorDraft(
  staticEdition: Edition,
  content: EditionContentRecord | null,
  storyHtmlFallback: string,
): EditionContentInput & { story_html: string } {
  return {
    title: content?.title ?? staticEdition.title,
    card_title: content?.card_title ?? staticEdition.cardTitle,
    excerpt: content?.excerpt ?? staticEdition.excerpt,
    story_html: content?.story_html ?? storyHtmlFallback,
    status: content?.status ?? staticEdition.status,
    date_label: content?.date_label ?? staticEdition.dateLabel,
    sort_date: content?.sort_date ?? staticEdition.sortDate,
    city: content?.city ?? staticEdition.city,
    country: content?.country ?? staticEdition.country,
    venue: content?.venue ?? staticEdition.venue ?? null,
    partner: content?.partner ?? staticEdition.partner ?? null,
    lineup_label: content?.lineup_label ?? staticEdition.lineupLabel ?? null,
    applications_open:
      content?.applications_open ?? staticEdition.applicationsOpen ?? false,
    theme_announced:
      content?.theme_announced ?? staticEdition.themeAnnounced ?? false,
  };
}
