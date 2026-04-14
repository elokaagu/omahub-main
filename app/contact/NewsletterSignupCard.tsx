"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isValidEmailFormat } from "./contactValidation";

const IDS = {
  firstName: "newsletter-first-name",
  lastName: "newsletter-last-name",
  email: "newsletter-email",
} as const;

export function NewsletterSignupCard() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterLastName, setNewsletterLastName] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isValidEmailFormat(newsletterEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          firstName: newsletterFirstName.trim() || null,
          lastName: newsletterLastName.trim() || null,
          source: "contact_form",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.alreadySubscribed) {
          toast.error("This email is already subscribed to our newsletter");
        } else {
          toast.error(errorData.error || "Failed to subscribe to newsletter");
        }
        return;
      }

      const result = await response.json();

      toast.success(
        result.message || "Successfully subscribed to our newsletter!"
      );
      setNewsletterEmail("");
      setNewsletterFirstName("");
      setNewsletterLastName("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("Failed to subscribe to newsletter. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div>
      <h3 className="heading-sm mb-6">Stay Connected</h3>
      <div className="bg-oma-beige p-8 rounded-lg">
        <h4 className="font-canela text-xl mb-4">Join Our Community</h4>
        <p className="text-oma-cocoa mb-6">
          Subscribe to our newsletter for exclusive updates, designer
          spotlights, and early access to new collections.
        </p>

        <form onSubmit={handleSubscribe} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id={IDS.firstName}
              type="text"
              placeholder="First name"
              value={newsletterFirstName}
              onChange={(e) => setNewsletterFirstName(e.target.value)}
              autoComplete="given-name"
              className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
            />
            <Input
              id={IDS.lastName}
              type="text"
              placeholder="Last name"
              value={newsletterLastName}
              onChange={(e) => setNewsletterLastName(e.target.value)}
              autoComplete="family-name"
              className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
            />
          </div>
          <Input
            id={IDS.email}
            type="email"
            placeholder="Enter your email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            autoComplete="email"
            className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
          />
          <Button
            type="submit"
            disabled={isSubscribing}
            className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
          >
            {isSubscribing ? "Subscribing..." : "Subscribe to Updates"}
          </Button>
        </form>

        <ul className="mt-6 space-y-2 text-sm text-oma-cocoa">
          <li className="flex items-center gap-2">
            <span className="text-oma-plum">•</span>
            Early access to new collections
          </li>
          <li className="flex items-center gap-2">
            <span className="text-oma-plum">•</span>
            Exclusive designer interviews
          </li>
          <li className="flex items-center gap-2">
            <span className="text-oma-plum">•</span>
            Special event invitations
          </li>
        </ul>
      </div>
    </div>
  );
}
