"use client";

import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/ui/section-header";
import { toast } from "sonner";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast.success("Your message has been sent successfully");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      // TODO: Replace with actual newsletter subscription API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thanks for subscribing!");
      setEmail("");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-6 py-12 md:py-24">
      <SectionHeader
        title="Get in Touch"
        subtitle="Have questions or inquiries? Reach out to our team and we'll get back to you shortly."
        centered
        className="mb-16"
        titleClassName="text-4xl md:text-5xl font-canela"
        subtitleClassName="text-base text-oma-cocoa/80 mt-2"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Contact Form */}
        <div className="bg-oma-beige p-8 rounded-lg">
          <h3 className="heading-sm mb-6">Send us a message</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-oma-black"
              >
                Your Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-oma-black"
              >
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-oma-black"
              >
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help you?"
                className="bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-oma-black"
              >
                Your Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Please describe your inquiry in detail..."
                className="min-h-[150px] bg-white border-oma-gold/30 focus-visible:ring-oma-plum"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* Contact Information & Map */}
        <div className="space-y-12">
          {/* Contact Information */}
          <div>
            <h3 className="heading-sm mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-oma-beige p-3 rounded-full">
                  <Mail className="h-5 w-5 text-oma-plum" />
                </div>
                <div>
                  <p className="font-medium text-oma-black">Email</p>
                  <a
                    href="mailto:info@oma-hub.com"
                    className="text-oma-cocoa hover:text-oma-plum expand-underline"
                  >
                    info@oma-hub.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-oma-beige p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-oma-plum"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-oma-black">Instagram</p>
                  <a
                    href="https://www.instagram.com/_omahub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-oma-cocoa hover:text-oma-plum expand-underline"
                  >
                    @omahub
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-oma-beige p-3 rounded-full">
                  <Mail className="h-5 w-5 text-oma-plum" />
                </div>
                <div>
                  <p className="font-medium text-oma-black">Collaboration</p>
                  <a
                    href="mailto:info@oma-hub.com"
                    className="text-oma-cocoa hover:text-oma-plum expand-underline"
                  >
                    info@oma-hub.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter & Updates Section */}
          <div>
            <h3 className="heading-sm mb-6">Stay Connected</h3>
            <div className="bg-oma-beige p-8 rounded-lg">
              <h4 className="font-canela text-xl mb-4">Join Our Community</h4>
              <p className="text-oma-cocoa mb-6">
                Subscribe to our newsletter for exclusive updates, designer
                spotlights, and early access to new collections.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-24">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about OmaHub."
          centered
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group bg-white p-8 rounded-lg border border-oma-gold/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-oma-gold/40 cursor-pointer">
            <h4 className="font-source text-xl mb-3 transition-colors duration-300 group-hover:text-oma-plum">
              How can designers join OmaHub?
            </h4>
            <p className="text-oma-cocoa">
              Designers can apply to join our platform through the &lsquo;Join
              the Hub&rsquo; page. Our curation team reviews each application to
              ensure the highest quality standards.
            </p>
          </div>

          <div className="group bg-white p-8 rounded-lg border border-oma-gold/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-oma-gold/40 cursor-pointer">
            <h4 className="font-source text-xl mb-3 transition-colors duration-300 group-hover:text-oma-plum">
              What regions do you currently cover?
            </h4>
            <p className="text-lg text-oma-cocoa mb-8">
              We currently showcase designers from around the world, with a
              focus on emerging talent and unique perspectives.
            </p>
          </div>

          <div className="group bg-white p-8 rounded-lg border border-oma-gold/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-oma-gold/40 cursor-pointer">
            <h4 className="font-source text-xl mb-3 transition-colors duration-300 group-hover:text-oma-plum">
              How do I connect with a designer?
            </h4>
            <p className="text-oma-cocoa">
              Each designer&apos;s profile includes a &lsquo;Contact
              Designer&rsquo; button where you can reach out directly. Our team
              can also help facilitate introductions for special projects.
            </p>
          </div>

          <div className="group bg-white p-8 rounded-lg border border-oma-gold/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-oma-gold/40 cursor-pointer">
            <h4 className="font-source text-xl mb-3 transition-colors duration-300 group-hover:text-oma-plum">
              Do you offer shipping for products?
            </h4>
            <p className="text-oma-cocoa">
              OmaHub is primarily a discovery and connection platform. Shipping
              arrangements are made directly between clients and designers after
              initial introduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
