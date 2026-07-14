"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X, Loader2, ImagePlus } from "lucide-react";
import {
  designerApplicationFormSchema,
  joinFormCategoryOptions,
} from "@/lib/validation/designerApplicationForm";
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
} as const;

type FormFieldName = keyof typeof EMPTY_FORM;

const FIELD_FOCUS_ORDER: FormFieldName[] = [
  "brandName",
  "designerName",
  "email",
  "phone",
  "website",
  "instagram",
  "location",
  "category",
  "description",
  "yearFounded",
];

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
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
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
  const { toast } = useToast();

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
        toast({
          title: "Upload failed",
          description:
            typeof json.error === "string" ? json.error : "Please try again.",
          variant: "destructive",
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
      toast({
        title: "Upload failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
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
      toast({
        title: "Please wait for your photos to finish uploading",
        variant: "destructive",
      });
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
      toast({
        title: next.imageUrls
          ? next.imageUrls
          : "Please fix the highlighted fields",
        variant: "destructive",
      });
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
        toast({
          title: "Application received",
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
        toast({
          title: "Submission error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "There was an error submitting your application. Please check your connection and try again.";
      toast({
        title: "Submission error",
        description: errorMessage,
        variant: "destructive",
      });
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
              <select
                {...fieldShell("category")}
                value={formData.category}
                onChange={handleChange}
                className={cn(
                  "h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  inputClass("category"),
                )}
              >
                <option value="">Select a category</option>
                {joinFormCategoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
            <Input
              {...fieldShell("yearFounded")}
              type="number"
              inputMode="numeric"
              min={1900}
              max={new Date().getFullYear() + 1}
              value={formData.yearFounded}
              onChange={handleChange}
              className={inputClass("yearFounded")}
              placeholder="e.g. 2020"
            />
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
