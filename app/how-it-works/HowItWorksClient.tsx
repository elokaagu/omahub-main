"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ArrowRight } from "lucide-react";

export default function HowItWorksClient() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);
  const designersRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, sectionId]));
        }
      });
    }, observerOptions);

    const sections = [
      heroRef,
      clientsRef,
      designersRef,
      featuresRef,
      faqRef,
      ctaRef,
    ];
    sections.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const getSectionTransform = (sectionId: string, baseOffset: number = 0) => {
    const isVisible = visibleSections.has(sectionId);
    const parallaxOffset = scrollY * 0.1 + baseOffset;

    return {
      transform: `translateY(${isVisible ? 0 : 50}px)`,
      opacity: isVisible ? 1 : 0,
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  return (
    <div className="w-full bg-gradient-to-b from-oma-beige/30 to-white min-h-screen">
      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        {/* Floating Graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full blur-xl animate-pulse" />
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 rounded-full blur-lg animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-br from-oma-beige/40 to-oma-plum/40 rounded-full blur-md animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-oma-beige/20 to-transparent" />
        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("hero")}
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full shadow-2xl" />
          </div>

          <h1 className="text-5xl md:text-7xl font-canela text-black mb-6 leading-tight">
            How OmaHub Works
          </h1>
          <p className="text-xl md:text-2xl text-black/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connecting fashion lovers with Africa's most talented designers
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-plum">500+</div>
              <div className="text-sm text-black/60">Designers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-gold">10k+</div>
              <div className="text-sm text-black/60">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-plum">50+</div>
              <div className="text-sm text-black/60">Countries</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-3 text-lg group"
            >
              <Link href="/directory">
                Explore Designers
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-3 text-lg"
            >
              <Link href="/join">Join as Designer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Clients Section */}
      <section
        ref={clientsRef}
        id="clients"
        className="py-24 px-6 relative"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto"
          style={getSectionTransform("clients")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              For Clients
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              Discover and connect with Africa's most talented fashion designers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Discover Designers",
                description:
                  "Browse through our curated collection of African fashion designers and their unique styles.",
              },
              {
                title: "Shop Collections",
                description:
                  "Explore ready-to-wear pieces and custom designs from your favorite designers.",
              },
              {
                title: "Connect Directly",
                description:
                  "Message designers directly to discuss custom pieces, sizing, and special requests.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{
                  transform: `translateY(${visibleSections.has("clients") ? 0 : 30}px)`,
                  opacity: visibleSections.has("clients") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-oma-plum/10 to-oma-plum/20 rounded-full mb-6 mx-auto" />
                <h3 className="text-xl font-semibold text-black mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-black/70 text-center leading-relaxed">
                  {step.description}
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-oma-plum to-oma-gold mt-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Designers Section */}
      <section
        ref={designersRef}
        id="designers"
        className="py-24 px-6 bg-gradient-to-br from-oma-beige/20 to-white/50 relative"
        style={{
          transform: `translateY(${scrollY * 0.15}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto"
          style={getSectionTransform("designers")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              For Designers
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              Showcase your talent and connect with fashion enthusiasts
              worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Create Your Profile",
                description:
                  "Build a stunning profile that showcases your unique style and design philosophy.",
              },
              {
                title: "Upload Collections",
                description:
                  "Share your latest collections and individual pieces with our global community.",
              },
              {
                title: "Connect with Clients",
                description:
                  "Receive inquiries, manage orders, and build lasting relationships with your customers.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{
                  transform: `translateY(${visibleSections.has("designers") ? 0 : 30}px)`,
                  opacity: visibleSections.has("designers") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-oma-gold/10 to-oma-gold/20 rounded-full mb-6 mx-auto" />
                <h3 className="text-xl font-semibold text-black mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-black/70 text-center leading-relaxed">
                  {step.description}
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-oma-gold to-oma-plum mt-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className="py-24 px-6 relative bg-gradient-to-br from-oma-plum/5 to-oma-gold/5"
        style={{
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto"
          style={getSectionTransform("features")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              A Platform You Can Trust
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              Built with both designers and clients in mind, ensuring quality
              and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Verified Designers",
                description: "All designers are carefully vetted and verified",
              },
              {
                title: "Transparent Process",
                description: "Clear communication and pricing throughout",
              },
              {
                title: "Quality Assured",
                description: "High-quality craftsmanship guaranteed",
              },
              {
                title: "Timely Delivery",
                description: "Reliable timelines and delivery tracking",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300"
                style={{
                  transform: `translateY(${visibleSections.has("features") ? 0 : 20}px)`,
                  opacity: visibleSections.has("features") ? 1 : 0,
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-black/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef}
        id="faq"
        className="py-24 px-6 relative"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      >
        <div className="max-w-4xl mx-auto" style={getSectionTransform("faq")}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-black/70">
              Everything you need to know about OmaHub
            </p>
          </div>

          <div className="space-y-4">
            {[
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
            ].map((faq, index) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => toggleFaq(faq.id)}
              >
                <CollapsibleTrigger
                  className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 text-left hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{
                    transform: `translateY(${visibleSections.has("faq") ? 0 : 20}px)`,
                    opacity: visibleSections.has("faq") ? 1 : 0,
                    transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-oma-plum/10 to-oma-plum/20 rounded-full" />
                      <h3 className="text-lg font-semibold text-black">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-oma-plum transition-transform duration-200 ${
                        openFaq === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6 text-black/70 leading-relaxed">
                  <div className="ml-13 mt-2">{faq.answer}</div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        id="cta"
        className="py-24 px-6 bg-gradient-to-br from-oma-plum/10 to-oma-beige/20 relative overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.05}px)`,
        }}
      >
        {/* Background Graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-oma-gold/10 to-oma-plum/10 rounded-full blur-xl" />
        </div>

        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("cta")}
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full shadow-2xl" />
          </div>

          <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
            Join thousands of fashion lovers discovering Africa's most talented
            designers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg"
            >
              <Link href="/directory">Start Shopping</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-4 text-lg"
            >
              <Link href="/join">Apply as Designer</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
