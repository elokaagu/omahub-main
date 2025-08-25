"use client";



import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listVisible, setListVisible] = useState(false);

  useEffect(() => {
    setListVisible(true);
  }, []);

  useEffect(() => {
    async function fetchFaqs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/faqs");
        const data = await response.json();
        if (response.ok) {
          setFaqs((data.faqs || []).filter((faq: any) => faq.is_active));
        } else {
          setError(data.error || "Failed to load FAQs");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-24">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-oma-gold/20 rounded-t-2xl">
          <div className="px-6 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-5xl md:text-6xl font-canela text-oma-plum mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-oma-cocoa max-w-2xl mb-2">
              Everything you need to know about OmaHub, from how to order to
              joining as a designer.
            </p>
          </div>
        </div>

        {/* FAQ List Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-oma-gold/20 overflow-hidden mt-8">
          <div className="p-8 lg:p-12">
            <div
              className={`space-y-4 transition-all duration-700 ${listVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              {loading ? (
                <div className="text-center text-oma-plum py-8">
                  Loading FAQs...
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : faqs.length === 0 ? (
                <div className="text-center text-black/60 py-8">
                  No FAQs found.
                </div>
              ) : (
                faqs.map((faq) => (
                  <Collapsible
                    key={faq.id}
                    open={openFaq === faq.id}
                    onOpenChange={() => toggleFaq(faq.id)}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-oma-plum/20 hover:border-oma-plum/40 transition-all duration-300 group focus:shadow-lg hover:shadow-lg">
                      <h3 className="text-lg font-canela font-semibold text-oma-plum text-left pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-oma-plum transition-transform duration-500 ease-cubic-bezier[.4,0,.2,1] ${openFaq === faq.id ? "rotate-180" : "rotate-0"}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 pb-6 transition-all duration-700 ease-cubic-bezier[.4,0,.2,1]">
                      <div className="markdown-content pt-4 text-oma-cocoa font-source leading-relaxed">
                        {faq.answer}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 pt-12 border-t border-oma-plum/20">
          <h2 className="text-2xl font-canela text-black mb-4">
            Still have questions?
          </h2>
          <p className="text-black/70 mb-8">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg group"
            >
              <Link href="/contact" className="flex items-center gap-3">
                Contact Support
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-4 text-lg group"
            >
              <Link href="/directory" className="flex items-center gap-3">
                Explore Designers
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
