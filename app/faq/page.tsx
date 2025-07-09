"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";

const faqList = [
  {
    id: "what-is-omahub",
    question: "What is OmaHub?",
    answer:
      "OmaHub is a platform that connects fashion enthusiasts with talented African designers. We showcase unique, high-quality pieces and facilitate direct connections between clients and designers.",
  },
  {
    id: "how-to-order",
    question: "How do I place an order?",
    answer:
      "Browse our designer profiles and collections, then contact designers directly through our platform. You can discuss custom pieces, sizing, pricing, and delivery details.",
  },
  {
    id: "custom-pieces",
    question: "Can I request custom pieces?",
    answer:
      "Yes! Many of our designers offer custom design services. You can discuss your vision directly with them and work together to create something unique.",
  },
  {
    id: "shipping",
    question: "How does shipping work?",
    answer:
      "Shipping is handled directly by each designer. When you contact a designer, they'll provide you with shipping options and costs for your location.",
  },
  {
    id: "join-designer",
    question: "How can I join as a designer?",
    answer:
      "Click 'Join as Designer' and fill out our application form. We'll review your portfolio and get back to you within 5-7 business days.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer:
      "Payment is handled directly between you and the designer. Most designers accept bank transfers, mobile money, and other local payment methods. Discuss payment options when you contact a designer.",
  },
  {
    id: "returns-refunds",
    question: "What is your return and refund policy?",
    answer:
      "Return and refund policies vary by designer. When you contact a designer, ask about their specific policies for returns, exchanges, and refunds.",
  },
  {
    id: "quality-guarantee",
    question: "Do you guarantee the quality of products?",
    answer:
      "We curate our designers carefully to ensure high quality, but each designer manages their own quality control. We recommend reading reviews and asking questions before making a purchase.",
  },
  {
    id: "contact-support",
    question: "How can I contact customer support?",
    answer:
      "You can reach our support team through the contact form on our website. We typically respond within 24-48 hours during business days.",
  },
];

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

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
        <div className="space-y-4">
          {faqList.map((faq) => (
            <Collapsible
              key={faq.id}
              open={openFaq === faq.id}
              onOpenChange={() => toggleFaq(faq.id)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-oma-plum/20 hover:border-oma-plum/40 transition-all duration-300 group">
                <h3 className="text-lg font-semibold text-black text-left pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-oma-plum transition-transform duration-300 ${
                    openFaq === faq.id ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6">
                <div className="pt-4 text-black/70 leading-relaxed">
                  {faq.answer}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
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
