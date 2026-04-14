import { SectionHeader } from "@/components/ui/section-header";
import { CONTACT_FAQ_ITEMS } from "./faqData";

export function ContactFaqSection() {
  return (
    <div className="mt-24">
      <SectionHeader
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about OmaHub."
        centered
        className="mb-12"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CONTACT_FAQ_ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white p-8 rounded-lg border border-oma-gold/20 transition-colors duration-300 hover:border-oma-gold/40"
          >
            <h4 className="font-source text-xl mb-3 text-oma-black">
              {item.title}
            </h4>
            <p
              className={`text-oma-cocoa ${item.bodyClassName ?? ""}`.trim()}
            >
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
