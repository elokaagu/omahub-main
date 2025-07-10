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
          // Only show active FAQs
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
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to How It Works
          </Link>

          <h1 className="text-5xl md:text-6xl font-canela text-black mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-black/70 max-w-2xl mx-auto">
            Everything you need to know about OmaHub, from how to order to
            joining as a designer.
          </p>
        </div>

        {/* FAQ List */}
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
            <div className="text-center text-black/60 py-8">No FAQs found.</div>
          ) : (
            faqs.map((faq) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => toggleFaq(faq.id)}
              >
                <CollapsibleTrigger className="w-full flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-oma-plum/20 hover:border-oma-plum/40 transition-all duration-300 group focus:shadow-lg hover:shadow-lg">
                  <h3 className="text-lg font-semibold text-black text-left pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-oma-plum transition-transform duration-500 ease-cubic-bezier[.4,0,.2,1] ${openFaq === faq.id ? "rotate-180" : "rotate-0"}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6 transition-all duration-700 ease-cubic-bezier[.4,0,.2,1]">
                  <div className="pt-4 text-black/70 leading-relaxed">
                    {faq.answer}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
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
