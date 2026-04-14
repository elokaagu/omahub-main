import { joinFaqItems } from "./joinFaqData";

export function JoinPageSidebar() {
  return (
    <div className="lg:col-span-2">
      <div className="sticky top-24">
        <h2 className="heading-sm mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {joinFaqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-oma-gold/20 bg-white/60 px-4 open:bg-white open:shadow-sm"
            >
              <summary className="cursor-pointer list-none py-3 font-medium text-oma-cocoa outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {item.question}
                  <span
                    className="text-oma-cocoa/50 transition group-open:rotate-180"
                    aria-hidden
                  >
                    ▼
                  </span>
                </span>
              </summary>
              <p className="border-t border-oma-gold/10 pb-4 pt-2 text-sm leading-relaxed text-oma-cocoa/90">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-oma-beige p-6">
          <h3 className="mb-4 font-canela text-xl">Need More Information?</h3>
          <p className="mb-4 text-oma-cocoa">
            If you have additional questions about joining OmaHub or need
            assistance with your application, our team is here to help.
          </p>
          <a
            href="mailto:info@oma-hub.com"
            className="expand-underline font-medium text-oma-plum hover:text-oma-plum/80"
          >
            Contact Our Designer Relations Team
          </a>
        </div>
      </div>
    </div>
  );
}
