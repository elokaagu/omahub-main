"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import {
  HERO_SLIDE_DISPLAY_ORDER_MAX,
  HERO_SLIDE_HERO_TITLE_MAX,
  HERO_SLIDE_SUBTITLE_MAX,
  HERO_SLIDE_TITLE_MAX,
  type HeroSlideFormShape,
} from "@/lib/studio/heroSlideForm";

type Field = keyof HeroSlideFormShape;

export type HeroSlideFormFieldsProps = {
  formData: HeroSlideFormShape;
  onFieldChange: (field: Field, value: string | boolean | number) => void;
  onImageUpload: (url: string) => void;
  /** Shown under display order while suggested order is loading (create page) */
  orderSuggestionHint?: string | null;
};

export function HeroSlideFormFields({
  formData,
  onFieldChange,
  onImageUpload,
  orderSuggestionHint,
}: HeroSlideFormFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => onFieldChange("title", e.target.value)}
              placeholder="e.g., Collections"
              required
              maxLength={HERO_SLIDE_TITLE_MAX}
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              Internal title for identification (max {HERO_SLIDE_TITLE_MAX}{" "}
              characters)
            </p>
          </div>
          <div>
            <Label htmlFor="hero_title">Hero Title *</Label>
            <Input
              id="hero_title"
              value={formData.hero_title || ""}
              onChange={(e) => onFieldChange("hero_title", e.target.value)}
              placeholder="e.g., New Season"
              required
              maxLength={HERO_SLIDE_HERO_TITLE_MAX}
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              Large title on the slide (max {HERO_SLIDE_HERO_TITLE_MAX}{" "}
              characters)
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Textarea
            id="subtitle"
            value={formData.subtitle || ""}
            onChange={(e) => onFieldChange("subtitle", e.target.value)}
            placeholder="Brief description that appears under the hero title"
            rows={2}
            maxLength={HERO_SLIDE_SUBTITLE_MAX}
          />
          <p className="text-xs text-oma-cocoa/70 mt-1">
            Optional; keep concise for layout (max {HERO_SLIDE_SUBTITLE_MAX}{" "}
            characters)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image">Hero Image *</Label>
            <FileUpload
              onUploadComplete={onImageUpload}
              defaultValue={formData.image}
              bucket="hero-images"
              path="slides"
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
              }}
              maxSize={20}
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              High-resolution image (recommended: 1920x1080 or larger, max
              20MB)
            </p>
          </div>
          <div>
            <Label htmlFor="link">Link URL</Label>
            <Input
              id="link"
              value={formData.link || ""}
              onChange={(e) => onFieldChange("link", e.target.value)}
              placeholder="/directory?category=Collections"
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              Where users go when they click the CTA button. Use internal paths
              (e.g., /directory, directory?category=Collections) or full URLs
              (e.g., https://example.com)
            </p>
            {formData.link &&
              !formData.link.startsWith("/") &&
              !formData.link.startsWith("http") &&
              !formData.link.includes(".") &&
              !formData.link.includes("?") &&
              !formData.link.includes("#") && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Simple paths like &quot;directory&quot; will be automatically
                  prefixed with &quot;/&quot; for internal navigation
                </p>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min={1}
              max={HERO_SLIDE_DISPLAY_ORDER_MAX}
              value={formData.display_order || 1}
              onChange={(e) =>
                onFieldChange(
                  "display_order",
                  parseInt(e.target.value, 10) || 1
                )
              }
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              Whole number from 1 to {HERO_SLIDE_DISPLAY_ORDER_MAX} (lower
              appears first). Suggested next slot is a hint only—two editors can
              still pick the same number.
            </p>
            {orderSuggestionHint ? (
              <p className="text-xs text-oma-cocoa/60 mt-1">
                {orderSuggestionHint}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_editorial"
                checked={formData.is_editorial ?? false}
                onCheckedChange={(checked) =>
                  onFieldChange("is_editorial", checked)
                }
              />
              <Label htmlFor="is_editorial">Editorial style</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active ?? false}
                onCheckedChange={(checked) =>
                  onFieldChange("is_active", checked)
                }
              />
              <Label htmlFor="is_active">
                Active (visible on homepage)
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
