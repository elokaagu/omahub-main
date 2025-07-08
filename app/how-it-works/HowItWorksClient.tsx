"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  ShoppingBag,
  MessageCircle,
  CheckCircle,
  Users,
  Palette,
  Globe,
  Sparkles,
  ArrowRight,
  Heart,
  Star,
  Zap,
  Target,
  Award,
  Briefcase,
  Camera,
  TrendingUp,
  Shield,
  ChevronDown,
} from "lucide-react";

export default function HowItWorksClient() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);
  const designersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full bg-black text-white overflow-hidden">
      {/* Hero Section with Parallax */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        {/* Animated Background Graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-20 left-10 w-32 h-32 border-2 border-white/20 rounded-full"
            style={{
              transform: `rotate(${scrollY * 0.1}deg) translateY(${scrollY * 0.2}px)`,
            }}
          />
          <div
            className="absolute top-40 right-20 w-20 h-20 bg-gradient-to-br from-oma-plum/30 to-oma-gold/30 rounded-lg"
            style={{
              transform: `rotate(${-scrollY * 0.15}deg) translateY(${scrollY * 0.3}px)`,
            }}
          />
          <div
            className="absolute bottom-40 left-1/4 w-16 h-16 border border-white/30"
            style={{
              transform: `rotate(${scrollY * 0.08}deg) translateX(${scrollY * 0.1}px)`,
            }}
          />

          {/* Corner Frames */}
          <div className="absolute top-8 left-8 w-16 h-16">
            <div className="absolute top-0 left-0 w-8 h-2 bg-white"></div>
            <div className="absolute top-0 left-0 w-2 h-8 bg-white"></div>
          </div>
          <div className="absolute top-8 right-8 w-16 h-16">
            <div className="absolute top-0 right-0 w-8 h-2 bg-white"></div>
            <div className="absolute top-0 right-0 w-2 h-8 bg-white"></div>
          </div>
          <div className="absolute bottom-8 left-8 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-8 h-2 bg-white"></div>
            <div className="absolute bottom-0 left-0 w-2 h-8 bg-white"></div>
          </div>
          <div className="absolute bottom-8 right-8 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-8 h-2 bg-white"></div>
            <div className="absolute bottom-0 right-0 w-2 h-8 bg-white"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <div
              className="inline-block mb-6"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            >
              <div className="relative">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-oma-plum" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-oma-gold rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Finally. A platform as{" "}
            <span className="bg-gradient-to-r from-oma-plum to-oma-gold bg-clip-text text-transparent">
              premium
            </span>{" "}
            as your brand.
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            OmaHub listeners aren't casual consumers of anything, they're the
            trend setters, the people who "discover it first". We've designed a
            premium, immersive environment that creates an exclusively above the
            fold home, fit for your brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => scrollToSection(clientsRef)}
              className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              For Clients
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => scrollToSection(designersRef)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              For Designers
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </section>

      {/* For Clients Section */}
      <section
        ref={clientsRef}
        className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black py-20"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold">For Clients</h2>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover exceptional designers and bring your fashion vision to
              life through our curated marketplace.
            </p>
          </div>

          {/* Client Journey Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left side - Steps */}
            <div className="space-y-8">
              {[
                {
                  icon: <Search className="w-8 h-8" />,
                  title: "Discover Premium Designers",
                  description:
                    "Browse our curated directory of world-class fashion designers, filtered by specialty, location, and style.",
                  color: "from-blue-500 to-purple-500",
                },
                {
                  icon: <MessageCircle className="w-8 h-8" />,
                  title: "Connect Directly",
                  description:
                    "Message designers directly, share your vision, and discuss your project needs in detail.",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  icon: <Heart className="w-8 h-8" />,
                  title: "Collaborate & Create",
                  description:
                    "Work closely with your chosen designer to bring your unique vision to life through custom pieces.",
                  color: "from-pink-500 to-red-500",
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Experience Excellence",
                  description:
                    "Receive your custom creation and enjoy the premium experience of owning truly unique fashion.",
                  color: "from-yellow-500 to-orange-500",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                  style={{
                    transform: `translateX(${scrollY * 0.05 * (index + 1)}px)`,
                  }}
                >
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side - Visual */}
            <div className="relative">
              <div
                className="relative z-10"
                style={{
                  transform: `translateY(${scrollY * 0.1}px)`,
                }}
              >
                <div className="w-80 h-80 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-oma-plum to-oma-gold rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-24 h-24 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Icons */}
              <div className="absolute top-10 left-10 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-float">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <div className="absolute top-20 right-10 w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center animate-float-delayed">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="absolute bottom-20 left-20 w-14 h-14 bg-pink-500/20 rounded-full flex items-center justify-center animate-float">
                <Target className="w-7 h-7 text-pink-400" />
              </div>
            </div>
          </div>

          {/* Client Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Shield className="w-8 h-8 text-green-400" />,
                title: "Verified Designers",
                description:
                  "All designers are carefully vetted for quality and professionalism.",
              },
              {
                icon: <Globe className="w-8 h-8 text-blue-400" />,
                title: "Global Reach",
                description:
                  "Connect with talented designers from around the world.",
              },
              {
                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                title: "Direct Communication",
                description:
                  "No middleman - communicate directly with your designer.",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              asChild
              className="bg-gradient-to-r from-oma-plum to-oma-gold hover:from-oma-plum/90 hover:to-oma-gold/90 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              <Link href="/directory">
                Browse Designer Directory
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Designers Section */}
      <section
        ref={designersRef}
        className="relative min-h-screen bg-gradient-to-br from-black to-gray-900 py-20"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-oma-gold to-oma-plum rounded-full flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold">For Designers</h2>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Showcase your talent to a global audience of discerning clients
              who appreciate exceptional craftsmanship.
            </p>
          </div>

          {/* Designer Journey Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left side - Visual */}
            <div className="relative order-2 lg:order-1">
              <div
                className="relative z-10"
                style={{
                  transform: `translateY(${-scrollY * 0.1}px)`,
                }}
              >
                <div className="w-80 h-80 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-oma-gold to-oma-plum rounded-full flex items-center justify-center">
                    <Palette className="w-24 h-24 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Icons */}
              <div className="absolute top-10 right-10 w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center animate-float">
                <Camera className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="absolute top-20 left-10 w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center animate-float-delayed">
                <Award className="w-6 h-6 text-orange-400" />
              </div>
              <div className="absolute bottom-20 right-20 w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center animate-float">
                <TrendingUp className="w-7 h-7 text-red-400" />
              </div>
            </div>

            {/* Right side - Steps */}
            <div className="space-y-8 order-1 lg:order-2">
              {[
                {
                  icon: <Briefcase className="w-8 h-8" />,
                  title: "Create Your Portfolio",
                  description:
                    "Showcase your best work with high-quality images and detailed descriptions of your design philosophy.",
                  color: "from-orange-500 to-red-500",
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Connect with Premium Clients",
                  description:
                    "Reach discerning clients who value exceptional craftsmanship and unique design perspectives.",
                  color: "from-red-500 to-pink-500",
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "Grow Your Brand",
                  description:
                    "Build your reputation, expand your client base, and establish yourself in the global fashion market.",
                  color: "from-pink-500 to-purple-500",
                },
                {
                  icon: <Award className="w-8 h-8" />,
                  title: "Achieve Recognition",
                  description:
                    "Gain exposure through our platform's premium positioning and curated designer community.",
                  color: "from-purple-500 to-blue-500",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                  style={{
                    transform: `translateX(${-scrollY * 0.05 * (index + 1)}px)`,
                  }}
                >
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Designer Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Globe className="w-8 h-8 text-blue-400" />,
                title: "Global Exposure",
                description:
                  "Reach clients worldwide through our premium platform.",
              },
              {
                icon: <Users className="w-8 h-8 text-green-400" />,
                title: "Quality Clients",
                description:
                  "Connect with clients who appreciate and pay for quality.",
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-purple-400" />,
                title: "Business Growth",
                description:
                  "Tools and exposure to help scale your fashion business.",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              asChild
              className="bg-gradient-to-r from-oma-gold to-oma-plum hover:from-oma-gold/90 hover:to-oma-plum/90 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              <Link href="/join">
                Join as a Designer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-oma-plum to-oma-gold">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Experience Premium Fashion?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of clients and designers who trust OmaHub for
            exceptional fashion experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              asChild
              className="bg-white text-oma-plum hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full"
            >
              <Link href="/directory">Find Your Designer</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-oma-plum px-8 py-4 text-lg font-semibold rounded-full"
            >
              <Link href="/join">Showcase Your Talent</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
