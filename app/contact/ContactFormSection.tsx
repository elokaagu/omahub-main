"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getEmailValidationError } from "./contactValidation";

const FIELD_IDS = {
  name: "contact-name",
  email: "contact-email",
  subject: "contact-subject",
  message: "contact-message",
} as const;

function errorId(field: keyof typeof FIELD_IDS) {
  return `${FIELD_IDS[field]}-error`;
}

export function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  /** Honeypot — must stay empty for legitimate submissions */
  const [hpField, setHpField] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    const emailErr = getEmailValidationError(formData.email);
    if (emailErr) newErrors.email = emailErr;

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          _contact_hp: hpField,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to send message. Please try again.";
        try {
          const errJson = await response.json();
          if (typeof errJson.error === "string") errMsg = errJson.error;
        } catch {
          /* ignore */
        }
        throw new Error(errMsg);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.message || "Your message has been sent successfully!"
        );
        setFormData({ name: "", email: "", subject: "", message: "" });
        setHpField("");
        setErrors({});
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);

      let errorMessage = "Failed to send message. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("Too many")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-oma-beige p-8 rounded-lg">
      <h3 className="heading-sm mb-6">Send us a message</h3>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-3">
          <label
            htmlFor={FIELD_IDS.name}
            className="block text-sm font-medium text-oma-black"
          >
            Your Name
          </label>
          <Input
            id={FIELD_IDS.name}
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
          />
          {errors.name ? (
            <p id={errorId("name")} className="text-sm text-red-500" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <label
            htmlFor={FIELD_IDS.email}
            className="block text-sm font-medium text-oma-black"
          >
            Email Address
          </label>
          <Input
            id={FIELD_IDS.email}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
          />
          {errors.email ? (
            <p
              id={errorId("email")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <label
            htmlFor={FIELD_IDS.subject}
            className="block text-sm font-medium text-oma-black"
          >
            Subject
          </label>
          <Input
            id={FIELD_IDS.subject}
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="How can we help you?"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? errorId("subject") : undefined}
            className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
          />
          {errors.subject ? (
            <p
              id={errorId("subject")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.subject}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <label
            htmlFor={FIELD_IDS.message}
            className="block text-sm font-medium text-oma-black"
          >
            Your Message
          </label>
          <Textarea
            id={FIELD_IDS.message}
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Please describe your inquiry in detail..."
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? errorId("message") : undefined}
            className="min-h-[150px] bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
          />
          {errors.message ? (
            <p
              id={errorId("message")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.message}
            </p>
          ) : null}
        </div>

        <input
          type="text"
          name="_contact_hp"
          value={hpField}
          onChange={(e) => setHpField(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-3"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending Message...
            </div>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
}
