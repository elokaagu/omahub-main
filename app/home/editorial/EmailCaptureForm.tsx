"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { NewsletterSubscribeBody } from "@/lib/validation/newsletterSubscribeBody";

type EmailCaptureFormProps = {
  source?: NewsletterSubscribeBody["source"];
  variant?: "dark" | "light";
  buttonLabel?: string;
  placeholder?: string;
  successMessage?: string;
  className?: string;
};

export function EmailCaptureForm({
  source = "website",
  variant = "dark",
  buttonLabel = "Notify me",
  placeholder = "Your email address",
  successMessage = "You're on the list. Watch your inbox.",
  className,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const isDark = variant === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source,
          _newsletter_hp: honeypot,
        }),
      });
      if (!res.ok) throw new Error(`subscribe ${res.status}`);
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error("email_capture_failed", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className={cn(
          "inline-flex max-w-md items-center gap-3 rounded-2xl px-5 py-4 text-sm tracking-wide",
          isDark
            ? "bg-white/10 text-oma-gold ring-1 ring-white/15 backdrop-blur-sm"
            : "bg-oma-plum/5 text-oma-plum ring-1 ring-oma-plum/10",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isDark ? "bg-oma-gold/20 text-oma-gold" : "bg-oma-plum/10 text-oma-plum",
          )}
        >
          ✓
        </span>
        <span>{successMessage}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-lg", className)}
      noValidate={false}
    >
      <div
        className={cn(
          "group flex flex-col gap-3 rounded-2xl p-2 transition-shadow duration-300 focus-within:ring-2 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5",
          isDark
            ? "bg-white/10 ring-1 ring-white/15 backdrop-blur-md focus-within:ring-oma-gold/40"
            : "bg-white shadow-[0_8px_30px_rgb(97_60_58_/_8%)] ring-1 ring-oma-cocoa/10 focus-within:ring-oma-plum/25",
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Email address"
          className={cn(
            "min-h-[48px] flex-1 rounded-xl bg-transparent px-4 text-base outline-none sm:rounded-full sm:px-5",
            isDark
              ? "text-white placeholder:text-white/45"
              : "text-oma-black placeholder:text-oma-cocoa/55",
          )}
        />

        {/* Honeypot — hidden from real users, matches the API's spam check */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          name="_newsletter_hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl px-6 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-full sm:px-7",
            isDark
              ? "bg-oma-gold text-oma-plum hover:bg-oma-gold/90 hover:shadow-[0_4px_20px_rgb(212_175_55_/_25%)]"
              : "bg-oma-plum text-white hover:bg-oma-plum/90 hover:shadow-[0_4px_20px_rgb(97_60_58_/_18%)]",
          )}
        >
          {status === "submitting" ? "Sending…" : buttonLabel}
        </button>
      </div>

      {status === "error" && (
        <p
          role="alert"
          className={cn(
            "mt-3 text-sm",
            isDark ? "text-red-300" : "text-red-600",
          )}
        >
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
