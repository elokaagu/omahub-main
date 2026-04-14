import { SectionHeader } from "@/components/ui/section-header";
import { ContactFaqSection } from "./ContactFaqSection";
import { ContactFormSection } from "./ContactFormSection";
import { ContactInfoSection } from "./ContactInfoSection";
import { NewsletterSignupCard } from "./NewsletterSignupCard";

export { metadata } from "./metadata";

export default function ContactPage() {
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
        <ContactFormSection />

        <div className="space-y-12">
          <ContactInfoSection />
          <NewsletterSignupCard />
        </div>
      </div>

      <ContactFaqSection />
    </div>
  );
}
