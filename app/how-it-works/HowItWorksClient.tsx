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

    return {
      transform: `translateY(${isVisible ? 0 : 50}px)`,
      opacity: isVisible ? 1 : 0,
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  // Calculate parallax effect with reduced intensity to prevent overlapping
  const getParallaxTransform = (factor: number) => {
    // Limit the parallax effect to prevent sections from overlapping
    const maxOffset = 100; // Maximum parallax offset
    const parallaxOffset = Math.min(scrollY * factor, maxOffset);
    return `translateY(${parallaxOffset}px)`;
  };

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
  ];

  return (
    <div
      className="relative w-full overflow-x-hidden snap-y snap-mandatory h-screen"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="min-h-screen snap-start flex items-center justify-center relative flex-col text-center px-4 pt-28 bg-gradient-to-b from-oma-beige/30 to-white"
        style={{
          transform: getParallaxTransform(0.08),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>

        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/community.jpg"
            alt="OmaHub Community"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/30 via-transparent to-oma-gold/20" />
        </div>

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
        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("hero")}
        >
          <h1 className="text-5xl md:text-7xl font-canela text-white mb-6 leading-tight">
            How OmaHub Works
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connecting fashion lovers with Africa's most talented designers
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-gold">500+</div>
              <div className="text-sm text-white/80">Designers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-gold">10k+</div>
              <div className="text-sm text-white/80">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-oma-gold">50+</div>
              <div className="text-sm text-white/80">Countries</div>
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
        className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative"
        style={{
          transform: getParallaxTransform(0.04),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        {/* Floating Graphics */}
        <div className="absolute top-8 left-1/4 w-24 h-24 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-12 right-12 w-8 h-8 bg-oma-gold rounded-full animate-bounce shadow-lg" />
        <div className="absolute top-1/2 right-0 w-4 h-4 bg-oma-plum rounded-full animate-ping" />
        <div className="absolute bottom-1/3 left-0 w-3 h-3 bg-oma-beige rounded-full animate-pulse" />
        <div
          className="max-w-6xl mx-auto relative z-10"
          style={getSectionTransform("clients")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-oma-cocoa mb-6">
              For Clients
            </h2>
            <p className="text-xl text-oma-cocoa/80 max-w-2xl mx-auto">
              Discover, connect, and create with Africa's best designers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Browse Designers",
                description:
                  "Explore a curated selection of top African designers and their collections.",
              },
              {
                title: "Connect Directly",
                description:
                  "Message designers, discuss your vision, and get personalized recommendations.",
              },
              {
                title: "Order with Confidence",
                description:
                  "Enjoy secure payments, transparent pricing, and reliable delivery.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-oma-gold/20"
                style={{
                  transform: `translateY(${visibleSections.has("clients") ? 0 : 30}px)`,
                  opacity: visibleSections.has("clients") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <h3 className="text-xl font-semibold text-oma-cocoa mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-oma-cocoa/80 text-center leading-relaxed">
                  {step.description}
                </p>
                <div className="w-full h-1 bg-gradient-to-r from-oma-gold to-oma-plum mt-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Selection CTA Section */}
      <section className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative overflow-hidden">
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>

        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Side - Animation */}
          <div className="flex-1 relative">
            <div className="relative w-80 h-80">
              {/* Animated Design Cards */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-64 bg-gradient-to-br from-oma-plum/30 to-oma-gold/30 rounded-lg border-2 border-oma-gold/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="w-full h-8 bg-oma-beige/30 rounded mb-4"></div>
                    <div className="w-3/4 h-4 bg-oma-cocoa/20 rounded mb-2"></div>
                    <div className="w-1/2 h-4 bg-oma-cocoa/20 rounded"></div>
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 transform -rotate-6 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="w-48 h-64 bg-gradient-to-br from-oma-gold/30 to-oma-beige/30 rounded-lg border-2 border-oma-plum/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="w-full h-8 bg-oma-beige/30 rounded mb-4"></div>
                    <div className="w-2/3 h-4 bg-oma-cocoa/20 rounded mb-2"></div>
                    <div className="w-3/4 h-4 bg-oma-cocoa/20 rounded"></div>
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 transform rotate-3 animate-pulse"
                style={{ animationDelay: "1s" }}
              >
                <div className="w-48 h-64 bg-gradient-to-br from-oma-beige/30 to-oma-plum/30 rounded-lg border-2 border-oma-beige/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="w-full h-8 bg-oma-gold/30 rounded mb-4"></div>
                    <div className="w-4/5 h-4 bg-oma-cocoa/20 rounded mb-2"></div>
                    <div className="w-1/3 h-4 bg-oma-cocoa/20 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-oma-gold rounded-full animate-bounce shadow-lg"></div>
              <div
                className="absolute bottom-8 left-8 w-4 h-4 bg-oma-plum rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div className="absolute top-1/2 left-0 w-3 h-3 bg-oma-beige rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 text-oma-cocoa pl-12">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              Curated, and not sorry about it.
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl">
              We're by invitation only; which means you only discover designers
              if our team of curators are convinced their work is exceptional
              for you. This ensures you'll only find pieces alongside others at
              the top of their craft.
            </p>

            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
            >
              <Link href="/directory" className="flex items-center gap-3">
                Explore Curated Designers
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Designers Section */}
      <section
        ref={designersRef}
        id="designers"
        className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative"
        style={{
          transform: getParallaxTransform(0.03),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        {/* Floating Graphics */}
        <div className="absolute top-10 right-1/4 w-20 h-20 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-16 left-16 w-7 h-7 bg-oma-plum rounded-full animate-bounce shadow-lg" />
        <div className="absolute top-1/3 left-0 w-4 h-4 bg-oma-gold rounded-full animate-ping" />
        <div className="absolute bottom-1/2 right-0 w-3 h-3 bg-oma-beige rounded-full animate-pulse" />
        <div
          className="max-w-6xl mx-auto relative z-10"
          style={getSectionTransform("designers")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-oma-cocoa mb-6">
              For Designers
            </h2>
            <p className="text-xl text-oma-cocoa/80 max-w-2xl mx-auto">
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
                className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-oma-gold/20"
                style={{
                  transform: `translateY(${visibleSections.has("designers") ? 0 : 30}px)`,
                  opacity: visibleSections.has("designers") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <h3 className="text-xl font-semibold text-oma-cocoa mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-oma-cocoa/80 text-center leading-relaxed">
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
        className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative"
        style={{
          transform: getParallaxTransform(0.02),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        {/* Floating Graphics */}
        <div className="absolute top-6 left-1/3 w-16 h-16 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-10 right-20 w-6 h-6 bg-oma-gold rounded-full animate-bounce shadow-lg" />
        <div className="absolute top-2/3 right-0 w-3 h-3 bg-oma-plum rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-oma-beige rounded-full animate-pulse" />
        <div
          className="max-w-6xl mx-auto relative z-10"
          style={getSectionTransform("features")}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-oma-cocoa mb-6">
              A Platform You Can Trust
            </h2>
            <p className="text-xl text-oma-cocoa/80 max-w-2xl mx-auto">
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
                className="bg-white/70 backdrop-blur-sm rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 border border-oma-plum/20"
                style={{
                  transform: `translateY(${visibleSections.has("features") ? 0 : 20}px)`,
                  opacity: visibleSections.has("features") ? 1 : 0,
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                <h3 className="text-lg font-semibold text-oma-cocoa mb-2">
                  {feature.title}
                </h3>
                <p className="text-oma-cocoa/80 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqRef}
        id="faq"
        className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative"
        style={{
          transform: getParallaxTransform(0.01),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        <div className="max-w-4xl mx-auto" style={getSectionTransform("faq")}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-canela text-oma-cocoa mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-oma-cocoa/80">
              Everything you need to know about OmaHub
            </p>
          </div>

          <div className="space-y-4">
            {faqList.map((faq, index) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => toggleFaq(faq.id)}
              >
                <CollapsibleTrigger
                  className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 text-left hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md border border-oma-gold/20"
                  style={{
                    transform: `translateY(${visibleSections.has("faq") ? 0 : 20}px)`,
                    opacity: visibleSections.has("faq") ? 1 : 0,
                    transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-oma-cocoa">
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
                <CollapsibleContent className="px-6 pb-6 text-oma-cocoa/80 leading-relaxed">
                  <div className="mt-2">{faq.answer}</div>
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
        className="min-h-screen snap-start flex items-center justify-center pt-28 pb-24 px-6 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative overflow-hidden"
        style={{
          transform: getParallaxTransform(0.005),
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        {/* Background Graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-oma-gold/10 to-oma-plum/10 rounded-full blur-xl" />
        </div>

        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("cta")}
        >
          <h2 className="text-4xl md:text-5xl font-canela text-oma-cocoa mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-oma-cocoa/80 mb-8 max-w-2xl mx-auto">
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
