import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQStructuredData } from "@/components/seo/StructuredData";
import { getPublicFaqs } from "@/lib/services/publicFaqService";
import { faqAnswerPlainText } from "@/lib/faqAnswerRendering";
import { FaqList } from "./FaqList";

export { metadata } from "./metadata";

export default async function FAQPage() {
  const { faqs, error } = await getPublicFaqs();

  const structuredFaqs = faqs.map((f) => ({
    question: f.question,
    answer: faqAnswerPlainText(f.answer),
  }));

  return (
    <>
      {structuredFaqs.length > 0 ? (
        <FAQStructuredData faqs={structuredFaqs} />
      ) : null}

      <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-40">
          <div className="rounded-t-2xl border-b border-oma-gold/20 bg-white/80 backdrop-blur-sm">
            <div className="px-6 py-6">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-oma-plum transition-colors hover:text-oma-plum/80"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Home
              </Link>
              <h1 className="mb-6 font-canela text-5xl text-oma-plum md:text-6xl">
                Frequently Asked Questions
              </h1>
              <p className="mb-2 max-w-2xl text-xl text-oma-cocoa">
                Everything you need to know about OmaHub, from how to order to
                joining as a designer.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-oma-gold/20 bg-white/90 shadow-xl backdrop-blur-sm">
            <div className="p-8 lg:p-12">
              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50/90 px-6 py-10 text-center"
                  role="alert"
                >
                  <p className="font-canela text-lg text-red-800">
                    We couldn&apos;t load FAQs right now
                  </p>
                  <p className="mt-2 text-sm text-red-700/90">
                    Please refresh the page or reach out via contact—we&apos;re
                    happy to help.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
                    >
                      <Link href="/faq">Try again</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-oma-plum text-white hover:bg-oma-plum/90"
                    >
                      <Link href="/contact">Contact us</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <FaqList faqs={faqs} />
              )}
            </div>
          </div>

          <div className="mt-16 border-t border-oma-plum/20 pt-12 text-center">
            <h2 className="mb-4 font-canela text-2xl text-black">
              Still have questions?
            </h2>
            <p className="mb-8 text-black/70">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to
              help.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group bg-oma-plum px-8 py-4 text-lg text-white hover:bg-oma-plum/90"
              >
                <Link href="/contact" className="flex items-center gap-3">
                  Contact Support
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-oma-plum px-8 py-4 text-lg text-oma-plum hover:bg-oma-plum/10"
              >
                <Link href="/directory" className="flex items-center gap-3">
                  Explore Designers
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
