"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  Sparkles,
  Heart,
  ArrowRight,
  Users,
  Crown,
  Palette,
  Zap,
  Star,
  Gem,
  Shirt,
  Ruler,
  Clock,
  CheckCircle,
  Camera,
  MessageCircle,
  MapPin,
  Award,
  Lightbulb,
  Rocket,
  ShoppingBag,
  Tag,
  Diamond,
  Glasses,
  Watch,
} from "lucide-react";

export default function TailoredClient() {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );

  const heroRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
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

    const sections = [heroRef, questionsRef, processRef, benefitsRef, ctaRef];
    sections.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const getSectionTransform = (sectionId: string) => {
    const isVisible = visibleSections.has(sectionId);

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

          {/* Fashion Icons */}
          <div className="absolute top-32 right-32 opacity-10">
            <Scissors
              className="w-16 h-16 text-oma-plum animate-bounce"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
          <div className="absolute bottom-32 left-32 opacity-10">
            <ShoppingBag
              className="w-12 h-12 text-oma-gold animate-bounce"
              style={{ animationDelay: "1.5s" }}
            />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-oma-beige/20 to-transparent" />
        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform("hero")}
        >
          {/* Hero Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Scissors className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-oma-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-canela text-black mb-8 leading-tight">
            Want to make a dress
            <br />
            <span className="text-oma-plum">from scratch?</span>
          </h1>

          <p className="text-xl md:text-2xl text-black/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your vision into reality with Africa's most skilled
            tailors
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg group"
            >
              <Link href="#questions">
                Yes, Let's Create!
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-4 text-lg group"
            >
              <Link href="/tailors">
                Browse Tailors
                <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex justify-center gap-8 text-sm text-black/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-oma-gold" />
              <span>Verified Tailors</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-oma-gold" />
              <span>Quality Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-oma-gold" />
              <span>Timely Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section
        ref={questionsRef}
        id="questions"
        className="min-h-screen flex items-center py-24 px-6 relative bg-gradient-to-br from-oma-plum/5 to-oma-gold/5"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto w-full"
          style={getSectionTransform("questions")}
        >
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-oma-plum" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              Does This Sound Like You?
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              If any of these resonate, our tailors are here to bring your
              vision to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Camera className="w-8 h-8 text-oma-plum" />,
                question:
                  "Found your wedding fit, suit or dress on Pinterest and want to recreate it?",
                description:
                  "Our tailors can recreate any design you've fallen in love with",
                graphic: (
                  <Heart className="w-12 h-12 text-oma-plum/20 absolute top-4 right-4" />
                ),
              },
              {
                icon: <Crown className="w-8 h-8 text-oma-gold" />,
                question: "Need a custom piece for a special occasion?",
                description:
                  "From red carpet events to traditional ceremonies, we've got you covered",
                graphic: (
                  <Star className="w-12 h-12 text-oma-gold/20 absolute top-4 right-4" />
                ),
              },
              {
                icon: <Ruler className="w-8 h-8 text-oma-plum" />,
                question:
                  "Struggling to find the perfect fit in ready-to-wear?",
                description:
                  "Get garments tailored exactly to your measurements and preferences",
                graphic: (
                  <Scissors className="w-12 h-12 text-oma-plum/20 absolute top-4 right-4" />
                ),
              },
              {
                icon: <Palette className="w-8 h-8 text-oma-gold" />,
                question: "Have a unique design idea in mind?",
                description:
                  "Work with skilled artisans to bring your creative vision to reality",
                graphic: (
                  <Sparkles className="w-12 h-12 text-oma-gold/20 absolute top-4 right-4" />
                ),
              },
              {
                icon: <Gem className="w-8 h-8 text-oma-plum" />,
                question: "Want something truly one-of-a-kind?",
                description:
                  "Create bespoke pieces that reflect your personal style and story",
                graphic: (
                  <Crown className="w-12 h-12 text-oma-plum/20 absolute top-4 right-4" />
                ),
              },
              {
                icon: <Shirt className="w-8 h-8 text-oma-gold" />,
                question: "Need alterations or adjustments?",
                description:
                  "Perfect the fit of existing garments with expert tailoring",
                graphic: (
                  <CheckCircle className="w-12 h-12 text-oma-gold/20 absolute top-4 right-4" />
                ),
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden"
                style={{
                  transform: `translateY(${visibleSections.has("questions") ? 0 : 30}px)`,
                  opacity: visibleSections.has("questions") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                {/* Corner Frames */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {item.graphic}
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-black mb-4 text-center leading-relaxed">
                  {item.question}
                </h3>
                <p className="text-black/70 text-center text-sm leading-relaxed">
                  {item.description}
                </p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-oma-plum to-oma-gold transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        ref={processRef}
        id="process"
        className="min-h-screen flex items-center py-24 px-6 relative"
        style={{
          transform: `translateY(${scrollY * 0.15}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto w-full"
          style={getSectionTransform("process")}
        >
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-oma-plum" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              How It Works
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              A simple 4-step process to create your perfect garment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: <Users className="w-8 h-8 text-white" />,
                title: "Choose Your Tailor",
                description:
                  "Browse our curated list of verified tailors and find one whose style resonates with you",
                color: "from-oma-plum to-oma-plum/80",
              },
              {
                step: "02",
                icon: <MessageCircle className="w-8 h-8 text-white" />,
                title: "Share Your Vision",
                description:
                  "Discuss your ideas, share inspiration photos, and collaborate on the design",
                color: "from-oma-gold to-oma-gold/80",
              },
              {
                step: "03",
                icon: <Ruler className="w-8 h-8 text-white" />,
                title: "Get Measured",
                description:
                  "Provide measurements or schedule a fitting session for the perfect fit",
                color: "from-oma-plum to-oma-plum/80",
              },
              {
                step: "04",
                icon: <Sparkles className="w-8 h-8 text-white" />,
                title: "Receive Your Creation",
                description:
                  "Watch your vision come to life with expert craftsmanship and attention to detail",
                color: "from-oma-gold to-oma-gold/80",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center group"
                style={{
                  transform: `translateY(${visibleSections.has("process") ? 0 : 30}px)`,
                  opacity: visibleSections.has("process") ? 1 : 0,
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.2}s`,
                }}
              >
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-oma-plum">
                      {step.step}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-black mb-4">
                  {step.title}
                </h3>
                <p className="text-black/70 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        ref={benefitsRef}
        id="benefits"
        className="min-h-screen flex items-center py-24 px-6 relative bg-gradient-to-br from-oma-beige/20 to-white/50"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      >
        <div
          className="max-w-6xl mx-auto w-full"
          style={getSectionTransform("benefits")}
        >
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-oma-gold" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
              Why Choose Tailored?
            </h2>
            <p className="text-xl text-black/70 max-w-2xl mx-auto">
              Experience the difference of truly personalized fashion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Crown className="w-8 h-8 text-oma-gold" />,
                title: "Perfect Fit",
                description:
                  "Garments tailored exactly to your body measurements and preferences",
              },
              {
                icon: <Gem className="w-8 h-8 text-oma-plum" />,
                title: "Unique Design",
                description:
                  "One-of-a-kind pieces that reflect your personal style and vision",
              },
              {
                icon: <Award className="w-8 h-8 text-oma-gold" />,
                title: "Premium Quality",
                description:
                  "Expert craftsmanship using high-quality materials and techniques",
              },
              {
                icon: <Users className="w-8 h-8 text-oma-plum" />,
                title: "Personal Service",
                description:
                  "Direct collaboration with skilled artisans throughout the process",
              },
              {
                icon: <Clock className="w-8 h-8 text-oma-gold" />,
                title: "Timeless Value",
                description:
                  "Investment pieces designed to last and remain stylish for years",
              },
              {
                icon: <MapPin className="w-8 h-8 text-oma-plum" />,
                title: "African Heritage",
                description:
                  "Support traditional craftsmanship and contemporary African design",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 group"
                style={{
                  transform: `translateY(${visibleSections.has("benefits") ? 0 : 20}px)`,
                  opacity: visibleSections.has("benefits") ? 1 : 0,
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                }}
              >
                {/* Corner Frames */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-oma-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-black mb-4">
                  {benefit.title}
                </h3>
                <p className="text-black/70 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        id="cta"
        className="min-h-screen flex items-center py-24 px-6 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 relative overflow-hidden"
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
          className="max-w-4xl mx-auto text-center relative z-10 w-full"
          style={getSectionTransform("cta")}
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full flex items-center justify-center shadow-2xl">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-canela text-black mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-black/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Explore our recommended tailors' catalogues and begin a consultation
            with the designer whose craft resonates with your vision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg group"
            >
              <Link href="/tailors">
                <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore Our Tailors
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-4 text-lg group"
            >
              <Link href="/how-it-works">
                <Lightbulb className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Learn More
              </Link>
            </Button>
          </div>

          {/* Final Trust Indicators */}
          <div className="mt-12 flex justify-center gap-8 text-sm text-black/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-oma-gold" />
              <span>50+ Verified Tailors</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-oma-gold" />
              <span>1000+ Happy Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-oma-gold" />
              <span>Expert Craftsmanship</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
