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
import {
  ChevronDown,
  ArrowRight,
  ShoppingBag,
  Gem,
  Diamond,
  Glasses,
  Watch,
  Crown,
  Scissors,
  Palette,
  Tag,
  Star,
  Heart,
} from "lucide-react";

export default function HowItWorksClient() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);
  const curatedRef = useRef<HTMLDivElement>(null);
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
      curatedRef,
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

  // Enhanced text animation states - slightly faster
  const getTextAnimationState = (sectionId: string, delay: number = 0) => {
    const isVisible = visibleSections.has(sectionId);

    return {
      transform: `translateY(${isVisible ? 0 : 40}px)`,
      opacity: isVisible ? 1 : 0,
      transition: `all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
    };
  };

  // Typewriter effect for headings - slightly faster
  const getTypewriterState = (sectionId: string) => {
    const isVisible = visibleSections.has(sectionId);

    return {
      width: isVisible ? "100%" : "0%",
      opacity: isVisible ? 1 : 0,
      transition:
        "width 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease-in-out",
      overflow: "hidden",
      whiteSpace: "nowrap",
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
      className="relative w-full overflow-x-hidden md:snap-y md:snap-mandatory h-screen"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="min-h-screen snap-start flex items-center justify-center relative flex-col text-center px-4 pt-24 sm:pt-28 bg-gradient-to-b from-oma-beige/30 to-white"
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
            style={{ maxHeight: "100vh" }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/30 via-transparent to-oma-gold/20" />
        </div>

        {/* Floating Graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full blur-xl animate-pulse" />
          <div
            className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 rounded-full blur-lg animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-40 left-20 w-10 h-10 bg-gradient-to-br from-oma-beige/40 to-oma-plum/40 rounded-full blur-md animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("hero")}
        >
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-canela text-white mb-4 sm:mb-6 leading-tight overflow-hidden drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]"
            style={getTypewriterState("hero")}
          >
            How OmaHub Works
          </h1>
          <p
            className="text-base sm:text-lg md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            style={getTextAnimationState("hero", 1)}
          >
            Connecting fashion lovers with Africa's most talented designers
          </p>

          {/* Stats */}
          <div
            className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 text-xs sm:text-sm text-oma-gold font-semibold mb-2 sm:mb-0"
            style={getTextAnimationState("hero", 1.8)}
          >
            <div>500+ Designers</div>
            <div>10k+ Happy Clients</div>
            <div>50+ Countries</div>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 w-full max-w-xs sm:max-w-none mx-auto"
            style={getTextAnimationState("hero", 1.4)}
          >
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg group w-full sm:w-auto"
            >
              <Link href="/directory">Explore Designers</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg group w-full sm:w-auto"
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
        className="min-h-screen snap-start flex items-center justify-center py-32 px-8 sm:px-16 lg:px-32 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative"
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
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col items-center justify-center md:flex-row gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Left - Meet Me Mockup */}
          <div className="flex-1 flex items-center justify-center w-full max-w-full">
            <img
              src="/meet-me.PNG"
              alt="Meet Me Collection Mobile Mockup"
              className="w-full max-w-xs sm:max-w-full rounded-2xl shadow-2xl border border-oma-beige/40"
              style={{ background: "transparent" }}
            />
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa w-full max-w-full">
            <h2
              className="text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden"
              style={getTypewriterState("clients")}
            >
              For Clients
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl"
              style={getTextAnimationState("clients", 0.6)}
            >
              Discover and connect with Africa's most talented designers. Enjoy
              a seamless, curated experience from inspiration to delivery.
            </p>
            <div style={getTextAnimationState("clients", 1)}>
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
        </div>
      </section>

      {/* Curated Selection CTA Section */}
      <section
        ref={curatedRef}
        id="curated"
        className="min-h-[120vh] md:min-h-screen snap-start flex items-center justify-center pt-32 pb-32 px-8 sm:px-16 lg:px-32 bg-gradient-to-br from-oma-beige/80 via-white/90 to-oma-gold/10 relative overflow-hidden"
      >
        {/* Corner Brackets */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>

        <div className="max-w-6xl mx-auto w-full h-full flex flex-col items-center justify-center md:flex-row gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Left Side - Animation with design-themed cards */}
          <div className="flex-1 relative flex flex-col items-center justify-center gap-6 w-full max-w-full mb-8 md:mb-0">
            {/* Existing animated cards */}
            <div className="relative w-full max-w-xs h-48 sm:h-80 mx-auto">
              {/* Design-themed animated cards */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-64 bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 rounded-lg border-2 border-oma-plum/40 backdrop-blur-sm">
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
                <div className="w-48 h-64 bg-gradient-to-br from-oma-plum/30 to-oma-beige/30 rounded-lg border-2 border-oma-gold/40 backdrop-blur-sm">
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
                <div className="w-48 h-64 bg-gradient-to-br from-oma-beige/30 to-oma-gold/30 rounded-lg border-2 border-oma-beige/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="w-full h-8 bg-oma-gold/30 rounded mb-4"></div>
                    <div className="w-4/5 h-4 bg-oma-cocoa/20 rounded mb-2"></div>
                    <div className="w-1/3 h-4 bg-oma-cocoa/20 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Design-themed floating elements */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-oma-plum rounded-full animate-bounce shadow-lg"></div>
              <div
                className="absolute bottom-8 left-8 w-4 h-4 bg-oma-gold rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div className="absolute top-1/2 left-0 w-3 h-3 bg-oma-beige rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 text-oma-cocoa pl-0 md:pl-12 w-full max-w-full px-4">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden break-words"
              style={getTypewriterState("curated")}
            >
              Curated, and not sorry about it.
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl"
              style={getTextAnimationState("curated", 0.6)}
            >
              We're by invitation only; which means you only discover designers
              if our team of curators are convinced their work is exceptional
              for you. This ensures you'll only find pieces alongside others at
              the top of their craft.
            </p>

            <div style={getTextAnimationState("curated", 1)}>
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
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col items-center justify-center md:flex-row gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Left - Animated Graphics with designer-themed cards and image */}
          <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-full mb-8 md:mb-0">
            <div className="relative w-full max-w-xs h-auto mx-auto">
              <img
                src="/omahub-perspective.PNG"
                alt="OmaHub Perspective Mockup"
                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-oma-beige/60 bg-white/80 object-cover"
                style={{ maxWidth: "100%" }}
              />
              {/* Designer-themed floating elements */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-oma-gold rounded-full animate-bounce shadow-lg"></div>
              <div
                className="absolute bottom-8 left-8 w-4 h-4 bg-oma-plum rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div className="absolute top-1/2 left-0 w-3 h-3 bg-oma-beige rounded-full animate-ping"></div>
            </div>
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa">
            <h2
              className="text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden"
              style={getTypewriterState("designers")}
            >
              For Designers
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl"
              style={getTextAnimationState("designers", 0.6)}
            >
              Share your vision and collections with a global audience. Build
              your brand, connect with clients, and grow your creative business
              on OmaHub.
            </p>
            <div style={getTextAnimationState("designers", 1)}>
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
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Right - Animated Graphics with platform-themed cards */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-80 h-80">
              {/* Platform-themed animated cards */}
              <div className="absolute inset-0 transform rotate-12 animate-pulse">
                <div className="w-48 h-64 bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 rounded-lg border-2 border-oma-plum/40 backdrop-blur-sm">
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
                <div className="w-48 h-64 bg-gradient-to-br from-oma-plum/30 to-oma-beige/30 rounded-lg border-2 border-oma-gold/40 backdrop-blur-sm">
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
                <div className="w-48 h-64 bg-gradient-to-br from-oma-beige/30 to-oma-gold/30 rounded-lg border-2 border-oma-beige/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="w-full h-8 bg-oma-gold/30 rounded mb-4"></div>
                    <div className="w-4/5 h-4 bg-oma-cocoa/20 rounded mb-2"></div>
                    <div className="w-1/3 h-4 bg-oma-cocoa/20 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Platform-themed floating elements */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-oma-plum rounded-full animate-bounce shadow-lg"></div>
              <div
                className="absolute bottom-8 left-8 w-4 h-4 bg-oma-gold rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div className="absolute top-1/2 left-0 w-3 h-3 bg-oma-beige rounded-full animate-ping"></div>
            </div>
          </div>
          {/* Left - Copy and CTA */}
          <div className="flex-1 pr-0 md:pr-12 text-oma-cocoa">
            <h2
              className="text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden"
              style={getTypewriterState("features")}
            >
              A Platform You Can Trust
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl"
              style={getTextAnimationState("features", 0.6)}
            >
              Built for both designers and clients, OmaHub ensures quality,
              transparency, and a seamless experience from start to finish.
            </p>
            <div style={getTextAnimationState("features", 1)}>
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
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Right - Animated Graphics with FAQ-themed cards */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-80 h-80">
              {/* FAQ-themed question mark graphic */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  {/* Large question mark */}
                  <div className="w-48 h-64 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-2xl border-2 border-oma-gold/40 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-oma-plum"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                    </svg>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-oma-gold rounded-full animate-bounce shadow-lg"></div>
                  <div
                    className="absolute -bottom-2 -left-2 w-6 h-6 bg-oma-plum rounded-full animate-bounce shadow-lg"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                  <div className="absolute top-1/2 -left-4 w-4 h-4 bg-oma-beige rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Left - Copy and CTA */}
          <div className="flex-1 pr-0 md:pr-12 text-oma-cocoa">
            <h2
              className="text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden"
              style={getTypewriterState("faq")}
            >
              Frequently Asked Questions
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl"
              style={getTextAnimationState("faq", 0.6)}
            >
              Everything you need to know about OmaHub, from how to order to
              joining as a designer. Still have questions? We're here to help.
            </p>
            <div style={getTextAnimationState("faq", 1)}>
              <Button
                asChild
                size="lg"
                className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg font-semibold group border-2 border-oma-plum hover:border-oma-gold transition-all duration-300"
              >
                <Link href="/faq" className="flex items-center gap-3">
                  Read All FAQs
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
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
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col items-center justify-center md:flex-row gap-12 relative z-10 px-2 sm:px-4 md:px-8">
          {/* Left - Animated Graphics with CTA-themed cards */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-80 h-80">
              {/* Ready to Get Started graphic */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  {/* Rocket/launch graphic */}
                  <div className="w-48 h-64 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 rounded-2xl border-2 border-oma-plum/40 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-oma-plum"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5zM12 22c-4.75-1.1-8-4.86-8-9V8.3l8-3.2 8 3.2V13c0 4.14-3.25 7.9-8 9z" />
                      <path d="M12 6l-6 2.4V13c0 3.64 2.43 6.97 6 8.4 3.57-1.43 6-4.76 6-8.4V8.4L12 6z" />
                      <path d="M12 10l-3 1.2V15c0 2.14 1.43 4.1 3 4.8 1.57-.7 3-2.66 3-4.8v-3.8L12 10z" />
                    </svg>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-oma-plum rounded-full animate-bounce shadow-lg"></div>
                  <div
                    className="absolute -bottom-2 -left-2 w-6 h-6 bg-oma-gold rounded-full animate-bounce shadow-lg"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                  <div className="absolute top-1/2 -left-4 w-4 h-4 bg-oma-beige rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Right - Copy and CTA */}
          <div className="flex-1 pl-0 md:pl-12 text-oma-cocoa text-center md:text-left">
            <h2
              className="text-4xl md:text-5xl font-canela mb-6 leading-tight overflow-hidden"
              style={getTypewriterState("cta")}
            >
              Ready to Get Started?
            </h2>
            <p
              className="text-xl text-oma-cocoa/80 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0"
              style={getTextAnimationState("cta", 0.6)}
            >
              Join thousands of fashion lovers discovering Africa's most
              talented designers, or apply to join our curated community.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              style={getTextAnimationState("cta", 1)}
            >
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
