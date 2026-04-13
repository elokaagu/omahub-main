import { createServerSupabaseClient } from "@/lib/supabase-unified";

const ABOUT_KEYS = ["about_omahub", "our_story"] as const;

export const FALLBACK_ABOUT_US = `OmaHub is a premier fashion tech platform dedicated to spotlighting Africa's emerging designers. We're creating a digital space where creativity, craftsmanship, and cultural expression intersect.

Our mission is to connect Africa's innovative fashion talent with a global audience, fostering discovery and celebration of the continent's rich design heritage.`;

export const FALLBACK_OUR_STORY = `OmaHub was born in 2025 from a deep belief: that Africa's designers deserve a global stage on their own terms. Rooted in the meaning of "Oma" (a West African word for beauty), we exist to honour the artistry shaping fashion across the continent.

What started as a simple idea, a digital space to spotlight emerging designers, has become a dynamic platform connecting creators to conscious consumers around the world.

OmaHub bridges tradition and innovation. We celebrate the bold, the handmade, and the culturally grounded, helping preserve traditional techniques while championing modern design. More than fashion, this is a movement for craft, community, and creativity.`;

/** Split CMS or fallback copy into paragraphs (blank line = break; else single newlines). */
export function toParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
  const byBlankLine = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;
  if (byBlankLine.length === 1 && byBlankLine[0].includes("\n")) {
    return byBlankLine[0]
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return byBlankLine.length ? byBlankLine : [normalized.trim()].filter(Boolean);
}

export type AboutContent = {
  aboutUs: string;
  ourStory: string;
};

/**
 * Single round-trip for About copy. On error or missing rows, returns static fallbacks
 * so the page always renders.
 */
export async function getAboutContent(): Promise<AboutContent> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [...ABOUT_KEYS]);

    if (error) {
      console.error("[getAboutContent] Supabase error:", error.message);
      return { aboutUs: FALLBACK_ABOUT_US, ourStory: FALLBACK_OUR_STORY };
    }

    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const key = row.key as string;
      const value =
        typeof row.value === "string" ? row.value.trim() : "";
      if (key) map.set(key, value);
    }

    return {
      aboutUs: map.get("about_omahub") || FALLBACK_ABOUT_US,
      ourStory: map.get("our_story") || FALLBACK_OUR_STORY,
    };
  } catch (e) {
    console.error("[getAboutContent]", e);
    return { aboutUs: FALLBACK_ABOUT_US, ourStory: FALLBACK_OUR_STORY };
  }
}
