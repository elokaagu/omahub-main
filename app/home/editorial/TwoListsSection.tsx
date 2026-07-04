import Link from "next/link";
import { EmailCaptureForm } from "./EmailCaptureForm";

/**
 * Two lists, two journeys: community members get early access to drops and
 * edition previews; designers get application windows and industry news.
 */
export function TwoListsSection() {
  return (
    <section id="join-the-list" className="bg-oma-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
            Two lists, two journeys
          </p>
          <h2 className="mt-2 font-canela text-4xl text-oma-black sm:text-5xl">
            Stay close to the next edition
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-oma-cocoa/20 bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              Community
            </p>
            <h3 className="mt-3 font-canela text-2xl text-oma-black sm:text-3xl">
              Get early access
            </h3>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-oma-black/70">
              Early access to drops, event previews, and exclusive edition
              content before it goes public.
            </p>
            <div className="mt-8">
              <EmailCaptureForm
                source="website"
                variant="light"
                buttonLabel="Join the list"
                successMessage="You're on the community list. See you at the next edition."
              />
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-oma-plum p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
              Designers &amp; Brands
            </p>
            <h3 className="mt-3 font-canela text-2xl sm:text-3xl">
              Join as a designer
            </h3>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-white/75">
              Apply for upcoming editions. Get application windows, industry
              insights, and edition themes, before anyone else.
            </p>
            <div className="mt-8">
              <Link
                href="/join"
                className="inline-flex min-h-[44px] items-center gap-2 border border-oma-gold px-6 text-xs font-semibold uppercase tracking-[0.2em] text-oma-gold transition-colors hover:bg-oma-gold hover:text-oma-plum"
              >
                Apply / Join the designer list <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
