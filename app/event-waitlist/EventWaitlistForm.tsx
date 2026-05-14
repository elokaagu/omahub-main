"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OMAHUB_PLATFORM_BRAND_ID_DEFAULT } from "@/lib/config/platformBrand";
import { toast } from "sonner";
import { getEmailValidationError } from "@/app/contact/contactValidation";

const OTHER_DESIGNER_VALUE = "__other__";

type DirectoryBrand = { id: string; name: string };

type FormState = {
  name: string;
  email: string;
  phone: string;
  itemDescription: string;
  size: string;
  colour: string;
  additionalNotes: string;
};

const IDS = {
  name: "evt-name",
  email: "evt-email",
  phone: "evt-phone",
  designerSelect: "evt-designer",
  otherDesigner: "evt-other-designer",
  itemDescription: "evt-item",
  size: "evt-size",
  colour: "evt-colour",
  additionalNotes: "evt-notes",
} as const;

function errId(field: string) {
  return `${field}-error`;
}

function isPlatformBrandRow(b: { id: string; name?: string | null }) {
  if (b.id === OMAHUB_PLATFORM_BRAND_ID_DEFAULT) return true;
  const n = (b.name ?? "").trim().toLowerCase();
  return n === "omahub platform";
}

export function EventWaitlistForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    itemDescription: "",
    size: "",
    colour: "",
    additionalNotes: "",
  });
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>("");
  const [otherDesignerName, setOtherDesignerName] = useState("");
  const [brands, setBrands] = useState<DirectoryBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [hpField, setHpField] = useState("");
  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof FormState | "designer" | "otherDesigner",
        string | undefined
      >
    >
  >({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const res = await fetch("/api/brands/public", { credentials: "same-origin" });
        if (!res.ok) throw new Error("Could not load designers");
        const json = (await res.json()) as { brands?: unknown[] };
        const raw = Array.isArray(json.brands) ? json.brands : [];
        const mapped: DirectoryBrand[] = raw
          .map((row) => {
            const r = row as { id?: unknown; name?: unknown };
            const id = typeof r.id === "string" ? r.id : "";
            const name = typeof r.name === "string" ? r.name.trim() : "";
            return id && name ? { id, name } : null;
          })
          .filter((b): b is DirectoryBrand => b !== null)
          .filter((b) => !isPlatformBrandRow(b))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
        if (!cancelled) setBrands(mapped);
      } catch {
        if (!cancelled) {
          setBrands([]);
          setBrandsError("Designers could not be loaded. Refresh the page or use Contact.");
        }
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showDesignerDropdown =
    !brandsLoading && !brandsError && brands.length > 0;

  const resolvedRequestedBrand = useMemo(() => {
    if (!showDesignerDropdown) {
      return otherDesignerName.trim();
    }
    if (!selectedDesignerId) return "";
    if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
      return otherDesignerName.trim();
    }
    return brands.find((b) => b.id === selectedDesignerId)?.name?.trim() ?? "";
  }, [
    showDesignerDropdown,
    selectedDesignerId,
    otherDesignerName,
    brands,
  ]);

  function validate() {
    const next: Partial<
      Record<keyof FormState | "designer" | "otherDesigner", string>
    > = {};
    if (!form.name.trim()) next.name = "Name is required";
    const emailErr = getEmailValidationError(form.email);
    if (emailErr) next.email = emailErr;
    if (showDesignerDropdown) {
      if (!selectedDesignerId) {
        next.designer = "Please choose a designer";
      } else if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
        if (!otherDesignerName.trim()) {
          next.otherDesigner = "Enter the designer or brand name";
        }
      }
    } else if (!brandsLoading) {
      if (!otherDesignerName.trim()) {
        next.designer = "Designer or brand name is required";
      }
    }
    if (!form.itemDescription.trim()) {
      next.itemDescription = "Describe the item or style you want";
    }
    if (!form.size.trim()) next.size = "Size is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    const requestedBrand = resolvedRequestedBrand;
    if (!requestedBrand) {
      toast.error("Please choose a designer");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/event-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          requestedBrand,
          itemDescription: form.itemDescription.trim(),
          size: form.size.trim(),
          colour: form.colour.trim() || undefined,
          additionalNotes: form.additionalNotes.trim() || undefined,
          _evt_hp: hpField,
        }),
      });

      if (!res.ok) {
        let msg = "Something went wrong. Please try again.";
        try {
          const j = (await res.json()) as { error?: string };
          if (typeof j.error === "string") msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as { success?: boolean };
      if (data.success) {
        toast.success(
          "You are on the list. Check your inbox for a confirmation email."
        );
        setForm({
          name: "",
          email: "",
          phone: "",
          itemDescription: "",
          size: "",
          colour: "",
          additionalNotes: "",
        });
        setSelectedDesignerId("");
        setOtherDesignerName("");
        setHpField("");
        setErrors({});
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again later.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg bg-oma-beige p-8">
      <p className="mb-6 text-sm text-oma-cocoa/85">
        Prefer email only? You can still reach us at{" "}
        <a
          href="mailto:info@oma-hub.com"
          className="text-oma-plum underline-offset-2 hover:underline"
        >
          info@oma-hub.com
        </a>
        . See also{" "}
        <Link
          href="https://luma.com/user/usr-10IvrGBF3vxclvm"
          className="text-oma-plum underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Events on Luma
        </Link>
        .
      </p>
      <form className="space-y-5" noValidate onSubmit={onSubmit}>
        <input
          type="text"
          name="_evt_hp_field"
          value={hpField}
          onChange={(e) => setHpField(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden
        />

        <div className="space-y-2">
          <label htmlFor={IDS.name} className="block text-sm font-medium text-oma-black">
            Your name
          </label>
          <Input
            id={IDS.name}
            name="name"
            value={form.name}
            onChange={onFieldChange}
            placeholder="Full name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? errId("name") : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.name ? (
            <p id={errId("name")} className="text-sm text-red-500" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={IDS.email} className="block text-sm font-medium text-oma-black">
            Email
          </label>
          <Input
            id={IDS.email}
            name="email"
            type="email"
            value={form.email}
            onChange={onFieldChange}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? errId("email") : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.email ? (
            <p id={errId("email")} className="text-sm text-red-500" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={IDS.phone} className="block text-sm font-medium text-oma-black">
            Phone (optional)
          </label>
          <Input
            id={IDS.phone}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onFieldChange}
            placeholder="+234 …"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <div className="space-y-2">
          <span
            id={`${IDS.designerSelect}-label`}
            className="block text-sm font-medium text-oma-black"
          >
            Designer / brand you want
          </span>
          {showDesignerDropdown ? (
            <Select
              value={selectedDesignerId || undefined}
              onValueChange={(v) => {
                setSelectedDesignerId(v);
                setErrors((prev) => ({
                  ...prev,
                  designer: undefined,
                  otherDesigner: undefined,
                }));
                if (v !== OTHER_DESIGNER_VALUE) setOtherDesignerName("");
              }}
            >
              <SelectTrigger
                id={IDS.designerSelect}
                aria-labelledby={`${IDS.designerSelect}-label`}
                aria-invalid={!!errors.designer}
                aria-describedby={
                  errors.designer ? errId("designer") : undefined
                }
                className="border-oma-gold/30 bg-white focus:ring-oma-plum"
              >
                <SelectValue placeholder="Select a designer" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_DESIGNER_VALUE}>
                  Other / not listed
                </SelectItem>
              </SelectContent>
            </Select>
          ) : brandsLoading ? (
            <div
              className="flex h-10 w-full items-center rounded-md border border-oma-gold/30 bg-white px-3 text-sm text-oma-cocoa/60"
              aria-busy="true"
            >
              Loading designers…
            </div>
          ) : (
            <>
              <Input
                id={IDS.designerSelect}
                value={otherDesignerName}
                onChange={(e) => {
                  setOtherDesignerName(e.target.value);
                  if (errors.designer) {
                    setErrors((prev) => ({ ...prev, designer: undefined }));
                  }
                }}
                placeholder="Designer or brand name"
                aria-labelledby={`${IDS.designerSelect}-label`}
                aria-invalid={!!errors.designer}
                aria-describedby={
                  errors.designer ? errId("designer") : undefined
                }
                className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
              />
              {brandsError ? (
                <p className="text-sm text-oma-cocoa/80" role="status">
                  {brandsError}{" "}
                  <Link
                    href="/contact"
                    className="text-oma-plum underline-offset-2 hover:underline"
                  >
                    Contact us
                  </Link>
                </p>
              ) : null}
            </>
          )}
          {errors.designer ? (
            <p id={errId("designer")} className="text-sm text-red-500" role="alert">
              {errors.designer}
            </p>
          ) : null}

          {showDesignerDropdown && selectedDesignerId === OTHER_DESIGNER_VALUE ? (
            <div className="space-y-2 pt-1">
              <label
                htmlFor={IDS.otherDesigner}
                className="block text-sm font-medium text-oma-black"
              >
                Designer or brand name
              </label>
              <Input
                id={IDS.otherDesigner}
                name="otherDesigner"
                value={otherDesignerName}
                onChange={(e) => {
                  setOtherDesignerName(e.target.value);
                  if (errors.otherDesigner) {
                    setErrors((prev) => ({ ...prev, otherDesigner: undefined }));
                  }
                }}
                placeholder="As you know them (Instagram, legal name, etc.)"
                aria-invalid={!!errors.otherDesigner}
                aria-describedby={
                  errors.otherDesigner ? errId("otherDesigner") : undefined
                }
                className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
              />
              {errors.otherDesigner ? (
                <p
                  id={errId("otherDesigner")}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.otherDesigner}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor={IDS.itemDescription}
            className="block text-sm font-medium text-oma-black"
          >
            Item or style
          </label>
          <Textarea
            id={IDS.itemDescription}
            name="itemDescription"
            value={form.itemDescription}
            onChange={onFieldChange}
            rows={4}
            placeholder="Product title, look, fabric, or link if you have one"
            aria-invalid={!!errors.itemDescription}
            aria-describedby={
              errors.itemDescription ? errId("itemDescription") : undefined
            }
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.itemDescription ? (
            <p
              id={errId("itemDescription")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.itemDescription}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={IDS.size} className="block text-sm font-medium text-oma-black">
            Size
          </label>
          <Input
            id={IDS.size}
            name="size"
            value={form.size}
            onChange={onFieldChange}
            placeholder="UK / EU / your usual — be specific"
            aria-invalid={!!errors.size}
            aria-describedby={errors.size ? errId("size") : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.size ? (
            <p id={errId("size")} className="text-sm text-red-500" role="alert">
              {errors.size}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={IDS.colour} className="block text-sm font-medium text-oma-black">
            Colour or variant (optional)
          </label>
          <Input
            id={IDS.colour}
            name="colour"
            value={form.colour}
            onChange={onFieldChange}
            placeholder="If applicable"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={IDS.additionalNotes}
            className="block text-sm font-medium text-oma-black"
          >
            Anything else we should know? (optional)
          </label>
          <Textarea
            id={IDS.additionalNotes}
            name="additionalNotes"
            value={form.additionalNotes}
            onChange={onFieldChange}
            rows={3}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || brandsLoading}
          className="w-full bg-oma-plum text-white hover:bg-oma-plum/90"
          title={brandsLoading ? "Loading designer list…" : undefined}
        >
          {submitting ? "Sending…" : "Join the waitlist"}
        </Button>
      </form>
    </div>
  );
}
