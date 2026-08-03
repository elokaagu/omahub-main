"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { X, Loader2, ImagePlus } from "lucide-react";
import {
  designerApplicationFormSchema,
  joinFormCategoryOptions,
} from "@/lib/validation/designerApplicationForm";
import {
  STUDIO_CURRENCIES_FOR_PRICE_SELECT,
  getFoundingYearOptions,
} from "@/lib/brands/studioBrandFormConstants";
import { formatPriceRange } from "@/lib/utils/priceFormatter";
import ApplicationConfirmationModal from "@/components/ApplicationConfirmationModal";

const MAX_PHOTOS = 3;

type PhotoSlot = { url: string | null; uploading: boolean };

/** One upload slot: click to pick a file. Upload is handled by the parent
 * (via onFileSelected) so slot state stays in one place. */
function PhotoUploadSlot({
  slot,
  onFileSelected,
  onRemove,
}: {
  slot: PhotoSlot;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = `photo-slot-${Math.random().toString(36).slice(2)}`;

  if (slot.url) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-oma-gold/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slot.url}
          alt="Uploaded brand photo"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-oma-gold/40 text-oma-cocoa transition-colors hover:border-oma-gold hover:text-oma-plum",
        slot.uploading && "pointer-events-none opacity-60",
      )}
    >
      {slot.uploading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ImagePlus className="h-5 w-5" />
      )}
      <span className="text-xs">
        {slot.uploading ? "Uploading…" : "Add photo"}
      </span>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={slot.uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFileSelected(file);
        }}
      />
    </label>
  );
}

const EMPTY_FORM = {
  brandName: "",
  designerName: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  location: "",
  category: "",
  description: "",
  yearFounded: "",
  currency: "USD",
  priceMin: "",
  priceMax: "",
  contactForPricing: false,
};

type FormData = {
  brandName: string;
  designerName: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  location: string;
  category: string;
  description: string;
  yearFounded: string;
  currency: string;
  priceMin: string;
  priceMax: string;
  contactForPricing: boolean;
};

type FormFieldName = keyof FormData;

const FIELD_FOCUS_ORDER: FormFieldName[] = [
  "brandName",
  "designerName",
  "email",
  "phone",
  "website",
  "instagram",
  "location",
  "category",
  "currency",
  "priceMin",
  "priceMax",
  "description",
  "yearFounded",
];

const foundingYearOptions = getFoundingYearOptions();

function zodFieldErrorsToRecord(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    const first = msgs?.[0];
    if (first) out[key] = first;
  }
  return out;
}

function parseApplicationResponse(json: unknown):
  | {
      ok: true;
      applicationId: string;
      message?: string;
    }
  | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Invalid response from server." };
  }
  const o = json as Record<string, unknown>;
  const idRaw = o.id ?? o.applicationId;
  if (o.success === true && typeof idRaw === "string" && idRaw.length > 0) {
    return {
      ok: true,
      applicationId: idRaw,
      message: typeof o.message === "string" ? o.message : undefined,
    };
  }
  const err =
    (typeof o.error === "string" && o.error) ||
    (typeof o.details === "string" && o.details) ||
    "Failed to submit application.";
  return { ok: false, error: err };
}

export function JoinApplicationForm() {
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
    Array.from({ length: MAX_PHOTOS }, () => ({ url: null, uploading: false })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<
    string | null
  >(null);
  const [submittedFormData, setSubmittedFormData] = useState<{
    brandName: string;
    designerName: string;
    email: string;
  } | null>(null);

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    clearFieldError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: FormFieldName, value: string) => {
    clearFieldError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelected = async (index: number, file: File) => {
    clearFieldError("imageUrls");
    setPhotoSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, uploading: true } : s)),
    );

    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/designer-application/upload-image", {
        method: "POST",
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || typeof json.url !== "string") {
        toast.error("Upload failed", {
          description:
            typeof json.error === "string" ? json.error : "Please try again.",
        });
        setPhotoSlots((prev) =>
          prev.map((s, i) => (i === index ? { ...s, uploading: false } : s)),
        );
        return;
      }
      setPhotoSlots((prev) =>
        prev.map((s, i) =>
          i === index ? { url: json.url, uploading: false } : s,
        ),
      );
    } catch {
      toast.error("Upload failed", {
        description: "Please check your connection and try again.",
      });
      setPhotoSlots((prev) =>
        prev.map((s, i) => (i === index ? { ...s, uploading: false } : s)),
      );
    }
  };

  const handlePhotoRemove = (index: number) => {
    setPhotoSlots((prev) =>
      prev.map((s, i) => (i === index ? { url: null, uploading: false } : s)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (photoSlots.some((s) => s.uploading)) {
      toast.error("Please wait for your photos to finish uploading");
      return;
    }

    setFieldErrors({});
    const imageUrls = photoSlots.map((s) => s.url).filter((u): u is string => !!u);
    const parsed = designerApplicationFormSchema.safeParse({
      ...formData,
      imageUrls,
    });
    if (!parsed.success) {
      const next = zodFieldErrorsToRecord(parsed.error.flatten().fieldErrors);
      setFieldErrors(next);
      const firstInvalid = FIELD_FOCUS_ORDER.find((k) => next[k]);
      if (firstInvalid) {
        queueMicrotask(() => document.getElementById(firstInvalid)?.focus());
      }
      toast.error(
        next.imageUrls ? next.imageUrls : "Please fix the highlighted fields",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/designer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      const result = parseApplicationResponse(json);

      if (response.ok && result.ok) {
        setSubmittedApplicationId(result.applicationId);
        setSubmittedFormData({
          brandName: formData.brandName,
          designerName: formData.designerName,
          email: formData.email,
        });
        toast.success("Application received", {
          description:
            result.message ??
            "Thank you - we've saved your application and sent a confirmation.",
        });
        setShowConfirmationModal(true);
        setFormData({ ...EMPTY_FORM });
        setPhotoSlots(
          Array.from({ length: MAX_PHOTOS }, () => ({
            url: null,
            uploading: false,
          })),
        );
      } else {
        const errorMessage = !result.ok
          ? result.error
          : "Failed to submit application.";
        toast.error("Submission error", { description: errorMessage });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "There was an error submitting your application. Please check your connection and try again.";
      toast.error("Submission error", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const err = (name: FormFieldName) => fieldErrors[name];
  const fieldShell = (name: FormFieldName) => ({
    id: name,
    name,
    "aria-invalid": !!err(name) || undefined,
    "aria-describedby": err(name) ? `${name}-error` : undefined,
  });

  const inputClass = (name: FormFieldName) =>
    cn("border-oma-gold/20", err(name) && "border-destructive");

  const selectTriggerClass = (name: FormFieldName) =>
    cn("border-oma-gold/20 bg-white", err(name) && "border-destructive");

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="brandName">Brand Name *</Label>
            <Input
              {...fieldShell("brandName")}
              value={formData.brandName}
              onChange={handleChange}
              className={inputClass("brandName")}
            />
            {err("brandName") && (
              <p
                id="brandName-error"
                className="mt-1 text-sm text-destructive"
                role="alert"
              >
                {err("brandName")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="designerName">Designer Name *</Label>
            <Input
              {...fieldShell("designerName")}
              value={formData.designerName}
              onChange={handleChange}
              className={inputClass("designerName")}
            />
            {err("designerName") && (
              <p
                id="designerName-error"
                className="mt-1 text-sm text-destructive"
                role="alert"
              >
                {err("designerName")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                {...fieldShell("email")}
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass("email")}
              />
              {err("email") && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("email")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                {...fieldShell("phone")}
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass("phone")}
              />
              {err("phone") && (
                <p
                  id="phone-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("phone")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="website">Website (if available)</Label>
              <Input
                {...fieldShell("website")}
                value={formData.website}
                onChange={handleChange}
                className={inputClass("website")}
                placeholder="https:// or yourdomain.com"
              />
              {err("website") && (
                <p
                  id="website-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("website")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                {...fieldShell("instagram")}
                value={formData.instagram}
                onChange={handleChange}
                className={inputClass("instagram")}
                placeholder="@handle or handle"
              />
              {err("instagram") && (
                <p
                  id="instagram-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("instagram")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                {...fieldShell("location")}
                value={formData.location}
                onChange={handleChange}
                className={inputClass("location")}
                placeholder="City, Country"
              />
              {err("location") && (
                <p
                  id="location-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("location")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Primary Category *</Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={!!err("category") || undefined}
                  aria-describedby={
                    err("category") ? "category-error" : undefined
                  }
                  className={selectTriggerClass("category")}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {joinFormCategoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("category") && (
                <p
                  id="category-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("category")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger
                  id="currency"
                  aria-invalid={!!err("currency") || undefined}
                  aria-describedby={
                    err("currency") ? "currency-error" : undefined
                  }
                  className={selectTriggerClass("currency")}
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_CURRENCIES_FOR_PRICE_SELECT.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("currency") && (
                <p
                  id="currency-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {err("currency")}
                </p>
              )}
            </div>

            <div>
              <Label>Price Range *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  {...fieldShell("priceMin")}
                  type="number"
                  min={0}
                  value={formData.priceMin}
                  onChange={handleChange}
                  className={inputClass("priceMin")}
                  placeholder="Min"
                  disabled={formData.contactForPricing}
                />
                <Input
                  {...fieldShell("priceMax")}
                  type="number"
                  min={0}
                  value={formData.priceMax}
                  onChange={handleChange}
                  className={inputClass("priceMax")}
                  placeholder="Max"
                  disabled={formData.contactForPricing}
                />
              </div>
              {!formData.contactForPricing &&
              formData.priceMin &&
              formData.priceMax &&
              formData.currency ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview:{" "}
                  {formatPriceRange(
                    formData.priceMin,
                    formData.priceMax,
                    STUDIO_CURRENCIES_FOR_PRICE_SELECT.find(
                      (c) => c.code === formData.currency,
                    )?.symbol || "$",
                  )}
                </p>
              ) : null}
              {(err("priceMin") || err("priceMax")) && (
                <p className="mt-1 text-sm text-destructive" role="alert">
                  {err("priceMin") || err("priceMax")}
                </p>
              )}
              <div className="mt-2 flex items-center space-x-2">
                <Checkbox
                  id="contactForPricing"
                  checked={formData.contactForPricing}
                  onCheckedChange={(checked) => {
                    clearFieldError("priceMin");
                    clearFieldError("priceMax");
                    setFormData((prev) => ({
                      ...prev,
                      contactForPricing: checked === true,
                    }));
                  }}
                />
                <Label
                  htmlFor="contactForPricing"
                  className="cursor-pointer text-sm font-normal text-muted-foreground"
                >
                  Explore brand for prices (prefer not to show specific prices)
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Tell us about your brand *</Label>
            <Textarea
              {...fieldShell("description")}
              value={formData.description}
              onChange={handleChange}
              className={cn("min-h-[120px]", inputClass("description"))}
              placeholder="Share your brand's story, vision, and what makes it unique..."
            />
            {err("description") && (
              <p
                id="description-error"
                className="mt-1 text-sm text-destructive"
                role="alert"
              >
                {err("description")}
              </p>
            )}
          </div>

          <div>
            <Label>Photos of your work *</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Upload 1-3 photos - these populate your brand profile if
              you&apos;re approved.
            </p>
            <div className="flex flex-wrap gap-3">
              {photoSlots.map((slot, i) => (
                <PhotoUploadSlot
                  key={i}
                  slot={slot}
                  onFileSelected={(file) => void handlePhotoSelected(i, file)}
                  onRemove={() => handlePhotoRemove(i)}
                />
              ))}
            </div>
            {fieldErrors.imageUrls && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {fieldErrors.imageUrls}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="yearFounded">Year Founded</Label>
            <Select
              value={formData.yearFounded || undefined}
              onValueChange={(value) =>
                handleSelectChange("yearFounded", value === "__none__" ? "" : value)
              }
            >
              <SelectTrigger
                id="yearFounded"
                aria-invalid={!!err("yearFounded") || undefined}
                aria-describedby={
                  err("yearFounded") ? "yearFounded-error" : undefined
                }
                className={selectTriggerClass("yearFounded")}
              >
                <SelectValue placeholder="Select founding year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not specified</SelectItem>
                {foundingYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("yearFounded") && (
              <p
                id="yearFounded-error"
                className="mt-1 text-sm text-destructive"
                role="alert"
              >
                {err("yearFounded")}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-oma-plum hover:bg-oma-plum/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </Button>
      </form>

      <ApplicationConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setSubmittedFormData(null);
          setSubmittedApplicationId(null);
        }}
        applicationId={submittedApplicationId ?? undefined}
        brandName={submittedFormData?.brandName}
        designerName={submittedFormData?.designerName}
        email={submittedFormData?.email}
      />
    </>
  );
}
