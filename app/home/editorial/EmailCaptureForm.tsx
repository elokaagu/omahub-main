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
      <p
        role="status"
        className={cn(
          "text-sm tracking-wide",
          isDark ? "text-oma-gold" : "text-oma-plum",
          className
        )}
      >
        {successMessage}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-md", className)}
      noValidate={false}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b pb-2",
          isDark ? "border-white/30" : "border-oma-plum/30"
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
            "flex-1 bg-transparent text-base outline-none min-h-[44px]",
            isDark
              ? "text-white placeholder:text-white/40"
              : "text-oma-black placeholder:text-oma-cocoa/60"
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
            "shrink-0 text-sm font-semibold uppercase tracking-[0.2em] transition-colors min-h-[44px] px-2 disabled:opacity-50",
            isDark
              ? "text-oma-gold hover:text-white"
              : "text-oma-plum hover:text-oma-cocoa"
          )}
        >
          {status === "submitting" ? "Sending…" : buttonLabel}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-400">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
