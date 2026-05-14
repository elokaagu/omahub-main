"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getEmailValidationError } from "@/app/contact/contactValidation";

type FormState = {
  name: string;
  email: string;
  phone: string;
  requestedBrand: string;
  itemDescription: string;
  size: string;
  colour: string;
  additionalNotes: string;
};

const IDS = {
  name: "evt-name",
  email: "evt-email",
  phone: "evt-phone",
  requestedBrand: "evt-brand",
  itemDescription: "evt-item",
  size: "evt-size",
  colour: "evt-colour",
  additionalNotes: "evt-notes",
} as const;

function errId(field: keyof typeof IDS) {
  return `${IDS[field]}-error`;
}

export function EventWaitlistForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    requestedBrand: "",
    itemDescription: "",
    size: "",
    colour: "",
    additionalNotes: "",
  });
  const [hpField, setHpField] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    const emailErr = getEmailValidationError(form.email);
    if (emailErr) next.email = emailErr;
    if (!form.requestedBrand.trim()) {
      next.requestedBrand = "Designer or brand name is required";
    }
    if (!form.itemDescription.trim()) {
      next.itemDescription = "Describe the item or style you want";
    }
    if (!form.size.trim()) next.size = "Size is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onChange(
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/event-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          requestedBrand: form.requestedBrand.trim(),
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
          requestedBrand: "",
          itemDescription: "",
          size: "",
          colour: "",
          additionalNotes: "",
        });
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
            placeholder="+234 …"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={IDS.requestedBrand}
            className="block text-sm font-medium text-oma-black"
          >
            Designer / brand you want
          </label>
          <Input
            id={IDS.requestedBrand}
            name="requestedBrand"
            value={form.requestedBrand}
            onChange={onChange}
            placeholder="e.g. name as shown on OmaHub or Instagram"
            aria-invalid={!!errors.requestedBrand}
            aria-describedby={
              errors.requestedBrand ? errId("requestedBrand") : undefined
            }
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.requestedBrand ? (
            <p
              id={errId("requestedBrand")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.requestedBrand}
            </p>
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
            rows={3}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-oma-plum text-white hover:bg-oma-plum/90"
        >
          {submitting ? "Sending…" : "Join the waitlist"}
        </Button>
      </form>
    </div>
  );
}
