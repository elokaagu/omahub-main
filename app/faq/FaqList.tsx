import { ChevronDown } from "lucide-react";
import type { PublicFaq } from "@/lib/types/publicFaq";
import {
  faqAnswerLooksLikeHtml,
} from "@/lib/faqAnswerRendering";
import { cn } from "@/lib/utils";

type FaqListProps = {
  faqs: PublicFaq[];
};

export function FaqList({ faqs }: FaqListProps) {
  if (faqs.length === 0) {
    return (
      <div className="rounded-xl border border-oma-gold/20 bg-oma-beige/40 px-6 py-12 text-center">
        <p className="font-canela text-lg text-oma-plum">No FAQs yet</p>
        <p className="mt-2 text-sm text-oma-cocoa/80">
          We are updating this page—please check back soon or contact us below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <details
          key={faq.id}
          className="group rounded-xl border border-oma-plum/20 bg-white/80 shadow-sm backdrop-blur-sm transition-all open:border-oma-plum/35 open:shadow-lg"
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-canela text-lg font-semibold text-oma-plum",
              "marker:content-none [&::-webkit-details-marker]:hidden"
            )}
          >
            <span className="text-left">{faq.question}</span>
            <ChevronDown
              className="h-5 w-5 shrink-0 text-oma-plum transition-transform duration-300 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="border-t border-oma-plum/10 px-6 pb-6 pt-2">
            {faqAnswerLooksLikeHtml(faq.answer) ? (
              <div
                className="markdown-content max-w-none pt-2 font-source leading-relaxed text-oma-cocoa [&_a]:text-oma-plum [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            ) : (
              <div className="whitespace-pre-wrap pt-2 font-source leading-relaxed text-oma-cocoa">
                {faq.answer}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
