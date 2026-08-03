"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OmaHubEditor from "@/app/components/OmaHubEditor";
import { AutosaveIndicator } from "@/components/studio/AutosaveIndicator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutosave } from "@/lib/hooks/useAutosave";
import type { Edition, EditionStatus } from "@/lib/data/editions";
import type { EditionContentInput } from "@/lib/services/editionContentService";
import { plainStoryToHtml } from "@/lib/editions/storyHtml";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type EditionEditorDraft = EditionContentInput & {
  story_html: string;
};

type EditionContentSectionProps = {
  slug: string;
  staticEdition: Edition;
  initialDraft: EditionEditorDraft;
};

async function uploadStoryImage(slug: string, file: File): Promise<string | null> {
  if (!supabase) {
    toast.error("Upload unavailable — sign in again");
    return null;
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${slug}/story/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("edition-galleries")
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("story image upload error", error);
    toast.error("Failed to upload image");
    return null;
  }

  const { data } = supabase.storage
    .from("edition-galleries")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export function EditionContentSection({
  slug,
  staticEdition,
  initialDraft,
}: EditionContentSectionProps) {
  const [draft, setDraft] = useState<EditionEditorDraft>(initialDraft);
  const [baseline, setBaseline] = useState(initialDraft);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    setDraft(initialDraft);
    setBaseline(initialDraft);
  }, [initialDraft]);

  const savePayload = useMemo(
    () => ({
      title: draft.title,
      card_title: draft.card_title,
      excerpt: draft.excerpt,
      story_html: draft.story_html,
      status: draft.status,
      date_label: draft.date_label,
      sort_date: draft.sort_date,
      city: draft.city,
      country: draft.country,
      venue: draft.venue,
      partner: draft.partner,
      lineup_label: draft.lineup_label,
      applications_open: draft.applications_open,
      theme_announced: draft.theme_announced,
    }),
    [draft],
  );

  const { status, lastSavedAt } = useAutosave({
    data: savePayload,
    baseline,
    debounceMs: 1200,
    shouldSkip: (data) => !data.title?.trim() || !data.story_html?.trim(),
    onSave: async (data) => {
      const response = await fetch(`/api/studio/editions/${slug}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save edition");
      }
      setBaseline({ ...draft });
    },
  });

  const updateField = <K extends keyof EditionEditorDraft>(
    key: K,
    value: EditionEditorDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        setIsUploadingImage(true);
        return await uploadStoryImage(slug, file);
      } finally {
        setIsUploadingImage(false);
      }
    },
    [slug],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-oma-black">
            Edition post
          </h2>
          <p className="text-sm text-oma-cocoa">
            Write the edition like a blog post — title, excerpt, and story with
            images placed wherever you need them. Changes autosave to Supabase.
          </p>
        </div>
        <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} />
      </div>

      <div className="grid gap-4 rounded-xl border border-oma-cocoa/15 bg-white p-5 sm:grid-cols-2 sm:p-6">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edition-title">Title</Label>
          <Input
            id="edition-title"
            value={draft.title ?? ""}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edition-card-title">Archive card title</Label>
          <Input
            id="edition-card-title"
            value={draft.card_title ?? ""}
            onChange={(e) => updateField("card_title", e.target.value)}
            placeholder="Line breaks use \n in the card UI"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edition-excerpt">Excerpt</Label>
          <Textarea
            id="edition-excerpt"
            rows={2}
            value={draft.excerpt ?? ""}
            onChange={(e) => updateField("excerpt", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={draft.status ?? staticEdition.status}
            onValueChange={(value) =>
              updateField("status", value as EditionStatus)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-date-label">Date label</Label>
          <Input
            id="edition-date-label"
            value={draft.date_label ?? ""}
            onChange={(e) => updateField("date_label", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-sort-date">Sort date</Label>
          <Input
            id="edition-sort-date"
            type="date"
            value={draft.sort_date ?? ""}
            onChange={(e) => updateField("sort_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-city">City</Label>
          <Input
            id="edition-city"
            value={draft.city ?? ""}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-country">Country</Label>
          <Input
            id="edition-country"
            value={draft.country ?? ""}
            onChange={(e) => updateField("country", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-venue">Venue</Label>
          <Input
            id="edition-venue"
            value={draft.venue ?? ""}
            onChange={(e) => updateField("venue", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-partner">Partner name</Label>
          <Input
            id="edition-partner"
            value={draft.partner ?? ""}
            onChange={(e) => updateField("partner", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edition-lineup-label">Lineup label</Label>
          <Input
            id="edition-lineup-label"
            value={draft.lineup_label ?? ""}
            onChange={(e) => updateField("lineup_label", e.target.value)}
            placeholder="e.g. 8 brands"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-oma-cocoa/10 px-3 py-2">
          <Label htmlFor="edition-applications-open">Applications open</Label>
          <Switch
            id="edition-applications-open"
            checked={!!draft.applications_open}
            onCheckedChange={(checked) =>
              updateField("applications_open", checked)
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-oma-cocoa/10 px-3 py-2">
          <Label htmlFor="edition-theme-announced">Theme announced</Label>
          <Switch
            id="edition-theme-announced"
            checked={!!draft.theme_announced}
            onCheckedChange={(checked) =>
              updateField("theme_announced", checked)
            }
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">The story</Label>
        <OmaHubEditor
          content={draft.story_html}
          onChange={(html) => updateField("story_html", html)}
          onUploadImage={handleUploadImage}
          isUploadingImage={isUploadingImage}
          className="max-w-none"
        />
        {!draft.story_html && (
          <p className="mt-2 text-xs text-oma-cocoa/70">
            Tip: use the image button in the toolbar to place photos anywhere in
            the story.
          </p>
        )}
      </div>
    </div>
  );
}

export function buildInitialEditionDraft(
  staticEdition: Edition,
  savedStoryHtml?: string | null,
): EditionEditorDraft {
  return {
    title: staticEdition.title,
    card_title: staticEdition.cardTitle,
    excerpt: staticEdition.excerpt,
    story_html: savedStoryHtml ?? plainStoryToHtml(staticEdition.story),
    status: staticEdition.status,
    date_label: staticEdition.dateLabel,
    sort_date: staticEdition.sortDate,
    city: staticEdition.city,
    country: staticEdition.country,
    venue: staticEdition.venue ?? null,
    partner: staticEdition.partner ?? null,
    lineup_label: staticEdition.lineupLabel ?? null,
    applications_open: staticEdition.applicationsOpen ?? false,
    theme_announced: staticEdition.themeAnnounced ?? false,
  };
}
