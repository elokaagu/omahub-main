import { SectionHeader } from "@/components/ui/section-header";
import { EventWaitlistForm } from "./EventWaitlistForm";

export { metadata } from "./metadata";

export default function EventWaitlistPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-12 md:py-20">
      <SectionHeader
        title="Event preorder & waitlist"
        subtitle="Tell us which designer and piece you want reserved for pickup at our Saturday event. You do not need the brand to update their profile - we route everything through OmaHub."
        centered
        className="mb-10"
        titleClassName="text-4xl md:text-5xl font-canela"
        subtitleClassName="mt-3 text-base text-oma-cocoa/80"
      />
      <EventWaitlistForm />
    </div>
  );
}
