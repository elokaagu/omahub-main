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
        {/* No corner brackets here */}

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
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left - Animated Graphics: stylized card stack with O shape */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* OmaHub O shape */}
              <div className="absolute top-8 left-8 w-32 h-32 rounded-full border-8 border-oma-plum/40 animate-float-slow"></div>
              {/* Card stack */}
              <div className="absolute inset-0 transform rotate-6 animate-pulse">
                <div className="w-40 h-56 bg-gradient-to-br from-oma-beige/60 to-oma-gold/30 rounded-lg border-2 border-oma-gold/30 backdrop-blur-sm"></div>
              </div>
              <div
                className="absolute inset-0 transform -rotate-3 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="w-40 h-56 bg-gradient-to-br from-oma-gold/30 to-oma-plum/10 rounded-lg border-2 border-oma-plum/30 backdrop-blur-sm"></div>
              </div>
              <div
                className="absolute inset-0 transform rotate-2 animate-pulse"
                style={{ animationDelay: "1s" }}
              >
                <div className="w-40 h-56 bg-gradient-to-br from-oma-beige/30 to-oma-plum/20 rounded-lg border-2 border-oma-beige/30 backdrop-blur-sm"></div>
              </div>
              {/* Small accent dot */}
              <div
                className="absolute bottom-8 left-8 w-4 h-4 bg-oma-plum rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.3s" }}
              ></div>
            </div>
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              For Clients
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl">
              Discover and connect with Africa’s most talented designers. Enjoy
              a seamless, curated experience from inspiration to delivery.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
            >
              <Link href="/directory" className="flex items-center gap-3">
                Explore Designers
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
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
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left - Animated Graphics */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* Fabric swatch shape */}
              <div className="absolute top-10 left-10 w-32 h-20 bg-gradient-to-br from-oma-gold/30 to-oma-beige/40 rounded-xl border-4 border-oma-plum/30 rotate-12 animate-float-slow"></div>
              {/* Card stack */}
              <div className="absolute inset-0 transform rotate-6 animate-pulse">
                <div className="w-40 h-56 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-lg border-2 border-oma-gold/30 backdrop-blur-sm"></div>
              </div>
              <div
                className="absolute inset-0 transform -rotate-3 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="w-40 h-56 bg-gradient-to-br from-oma-gold/20 to-oma-beige/20 rounded-lg border-2 border-oma-plum/30 backdrop-blur-sm"></div>
              </div>
              {/* Accent O shape */}
              <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border-4 border-oma-gold/40 animate-bounce"></div>
            </div>
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              For Designers
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl">
              Share your vision and collections with a global audience. Build
              your brand, connect with clients, and grow your creative business
              on OmaHub.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
            >
              <Link href="/join" className="flex items-center gap-3">
                Apply as Designer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
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
        <div className="absolute top-6 left-1/3 w-16 h-16 bg-gradient-to-br from-oma-gold/30 to-oma-plum/10 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-10 right-20 w-10 h-10 bg-oma-plum rounded-full animate-bounce shadow-lg" />
        <div className="absolute top-2/3 right-0 w-4 h-4 bg-oma-gold rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-0 w-3 h-3 bg-oma-beige rounded-full animate-pulse" />
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10">
          {/* Right - Animated Graphics (now on right) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* Abstract O shape */}
              <div className="absolute top-8 right-8 w-28 h-28 rounded-full border-8 border-oma-gold/40 animate-float-slow"></div>
              {/* Card stack */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-48 bg-gradient-to-br from-oma-gold/30 to-oma-beige/30 rounded-full border-2 border-oma-plum/30 backdrop-blur-sm"></div>
              </div>
              {/* Accent dot */}
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-oma-plum rounded-full animate-bounce shadow-lg"></div>
            </div>
          </div>
          {/* Left - Copy and CTA */}
          <div className="flex-1 pr-0 md:pr-12 text-oma-cocoa">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              A Platform You Can Trust
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl">
              Built for both designers and clients, OmaHub ensures quality,
              transparency, and a seamless experience from start to finish.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
            >
              <Link href="/about" className="flex items-center gap-3">
                Why OmaHub?
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ SECTION (OmaHub-related animation) */}
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
        {/* Floating Graphics */}
        <div className="absolute top-10 left-1/4 w-20 h-20 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-16 right-16 w-10 h-10 bg-oma-plum/30 rounded-full animate-bounce shadow-lg" />
        <div className="absolute top-1/3 right-0 w-5 h-5 bg-oma-gold/30 rounded-full animate-ping" />
        <div className="absolute bottom-1/2 left-0 w-4 h-4 bg-oma-beige/40 rounded-full animate-pulse" />
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10">
          {/* Right - Animated Graphics (now on right) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* O shape */}
              <div className="absolute top-8 right-8 w-24 h-24 rounded-full border-8 border-oma-plum/30 animate-float-slow"></div>
              {/* Card stack */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-48 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-2xl border-2 border-oma-gold/30 backdrop-blur-sm"></div>
              </div>
              {/* Accent dot */}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-oma-gold rounded-full animate-bounce shadow-lg"></div>
            </div>
          </div>
          {/* Left - Copy and CTA */}
          <div className="flex-1 pr-0 md:pr-12 text-oma-cocoa">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl">
              Everything you need to know about OmaHub, from how to order to
              joining as a designer. Still have questions? We’re here to help.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
            >
              <Link href="#faq-list" className="flex items-center gap-3">
                Read All FAQs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA SECTION (OmaHub-related animation) */}
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
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left - Animated Graphics (keep on left for CTA) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {/* O shape */}
              <div className="absolute top-8 left-8 w-24 h-24 rounded-full border-8 border-oma-gold/40 animate-float-slow"></div>
              {/* Card stack */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-48 bg-gradient-to-br from-oma-gold/30 to-oma-plum/20 rounded-2xl border-2 border-oma-gold/30 backdrop-blur-sm"></div>
              </div>
              {/* Accent dot */}
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-oma-plum rounded-full animate-bounce shadow-lg"></div>
            </div>
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-canela mb-6 leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
              Join thousands of fashion lovers discovering Africa’s most
              talented designers, or apply to join our curated community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
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
        </div>
      </section>
    </div>
  );
}
