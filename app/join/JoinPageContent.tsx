"use client";

import { AnimatedSectionHeader } from "@/components/ui/animated-section-header";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { JoinApplicationForm } from "./JoinApplicationForm";
import { JoinPageSidebar } from "./JoinPageSidebar";

export function JoinPageContent() {
  return (
    <>
      <section className="bg-gradient-to-r from-oma-gold/20 to-oma-cocoa/20 px-6 pb-16 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSectionHeader
            title="Join Our Designer Community"
            subtitle="Apply to become part of our curated directory of innovative fashion designers"
            centered
            titleClassName="font-canela text-3xl md:text-4xl"
            subtitleClassName="text-oma-cocoa/80"
          />
          <AnimateOnScroll animation="slideUp" delay={0.1} duration={0.65}>
            <p className="mb-2 text-lg text-oma-cocoa">
              Exceptional craft, a clear design point of view, and authentic
              brand storytelling.
            </p>
            <p className="text-sm text-oma-cocoa/70">
              This application usually takes about 3–5 minutes.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <AnimateOnScroll animation="slideUp" duration={0.7} className="lg:col-span-3">
              <h2 className="heading-sm mb-2">Designer Application</h2>
              <p className="mb-6 text-sm text-oma-cocoa/70">
                Fields marked * are required. We&apos;ll email you a confirmation
                after you submit.
              </p>
              <JoinApplicationForm />
            </AnimateOnScroll>

            <AnimateOnScroll
              animation="slideUp"
              delay={0.14}
              duration={0.7}
              className="lg:col-span-2"
            >
              <JoinPageSidebar />
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
