import { SectionHeader } from "@/components/ui/section-header";
import { JoinApplicationForm } from "./JoinApplicationForm";
import { JoinPageSidebar } from "./JoinPageSidebar";

export { metadata } from "./metadata";

export default function JoinPage() {
  return (
    <>
      <section className="bg-gradient-to-r from-oma-gold/20 to-oma-cocoa/20 px-6 pb-16 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeader
            title="Join Our Designer Community"
            subtitle="Apply to become part of our curated directory of innovative fashion designers"
            centered
            titleClassName="font-canela text-3xl md:text-4xl"
            subtitleClassName="text-oma-cocoa/80"
          />
          <p className="mb-2 text-lg text-oma-cocoa">
            Exceptional craft, a clear design point of view, and authentic
            brand storytelling.
          </p>
          <p className="text-sm text-oma-cocoa/70">
            This application usually takes about 3–5 minutes.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 className="heading-sm mb-2">Designer Application</h2>
              <p className="mb-6 text-sm text-oma-cocoa/70">
                Fields marked * are required. We&apos;ll email you a confirmation
                after you submit.
              </p>
              <JoinApplicationForm />
            </div>
            <JoinPageSidebar />
          </div>
        </div>
      </section>
    </>
  );
}
