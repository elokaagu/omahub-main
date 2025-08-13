"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { BrandCard } from "@/components/ui/brand-card";

// Animation helpers inspired by HowItWorksClient
const getSectionTransform = (isVisible: boolean) => ({
  transform: `translateY(${isVisible ? 0 : 50}px)`,
  opacity: isVisible ? 1 : 0,
  transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
});
const getTextAnimationState = (isVisible: boolean, delay: number = 0) => ({
  transform: `translateY(${isVisible ? 0 : 40}px)`,
  opacity: isVisible ? 1 : 0,
  transition: `all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
});
const getTypewriterState = (isVisible: boolean) => ({
  width: isVisible ? "100%" : "0%",
  opacity: isVisible ? 1 : 0,
  transition:
    "width 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease-in-out",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

export default function TailoredClient() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );
  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string>(
    "/lovable-uploads/tailored-image.jpg"
  ); // Tailored hero image
  const [isHovered, setIsHovered] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const tailorsGalleryRef = useRef<HTMLDivElement>(null);
  const tailorsScrollRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  // Autoscroll functionality for tailors carousel
  useEffect(() => {
    if (!tailorsScrollRef.current || isHovered) return;

    const scrollContainer = tailorsScrollRef.current;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) return; // No need to scroll if content fits

    const autoScroll = setInterval(() => {
      if (scrollContainer.scrollLeft >= maxScroll) {
        // Reset to beginning when reaching the end
        scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Scroll by 300px every 3 seconds
        scrollContainer.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(autoScroll);
  }, [isHovered]);

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
      tailorsGalleryRef,
      questionsRef,
      processRef,
      benefitsRef,
      ctaRef,
    ];
    sections.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    // Add hero observer for animation
    const heroObserver = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setHeroVisible(true);
        });
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) heroObserver.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchTailors() {
      try {
        setLoading(true);
        const data = await getTailorsWithBrands();
        console.log("Fetched tailors data:", data);
        setTailors(data);

        // Always use the static tailored hero image
      } catch (err) {
        console.error("Error fetching tailors:", err);
        setError("Failed to load tailor information");
      } finally {
        setLoading(false);
      }
    }
    fetchTailors();
  }, []);

  return (
    <div
      className="relative w-full snap-y snap-mandatory overflow-y-auto h-screen"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="min-h-screen snap-start flex items-center justify-center relative flex-col text-center px-4 pt-24 sm:pt-28 bg-gradient-to-b from-oma-beige/30 to-white"
      >
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={heroImage}
            alt="Featured Tailor"
            className="w-full h-full object-cover object-center"
            style={{ maxHeight: "100vh" }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/30 via-transparent to-oma-gold/20" />
        </div>
        <div
          className="max-w-4xl mx-auto text-center relative z-10"
          style={getSectionTransform(heroVisible)}
        >
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-canela text-white mb-4 sm:mb-6 leading-tight overflow-hidden drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]"
            style={getTypewriterState(heroVisible)}
          >
            Want to make a dress
            <br />
            <span
              className="text-white"
              style={getTextAnimationState(heroVisible, 0.5)}
            >
              from scratch?
            </span>
          </h1>
          <p
            className="text-base sm:text-lg md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            style={getTextAnimationState(heroVisible, 1)}
          >
            Transform your vision into reality with Africa's most skilled
            tailors
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 w-full max-w-xs sm:max-w-none mx-auto"
            style={getTextAnimationState(heroVisible, 1.4)}
          >
            <Button
              asChild
              size="lg"
              className="bg-oma-plum hover:bg-oma-plum/90 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg group w-full sm:w-auto"
            >
              <Link href="#questions">Yes, Let's Create!</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg group w-full sm:w-auto"
            >
              <Link href="/tailors">Browse Tailors</Link>
            </Button>
          </div>
          <div
            className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 text-xs sm:text-sm text-oma-gold font-semibold mb-2 sm:mb-0"
            style={getTextAnimationState(heroVisible, 1.8)}
          >
            <div>Verified Tailors</div>
            <div>Quality Guaranteed</div>
            <div>Timely Delivery</div>
          </div>
        </div>
      </section>
      {/* Tailors Gallery Section */}
      <section
        ref={tailorsGalleryRef}
        id="tailors-gallery"
        className="py-16 sm:py-24 px-0 bg-white/90 border-t border-oma-beige/30 snap-start w-screen overflow-x-hidden relative"
        style={getSectionTransform(visibleSections.has("tailors-gallery"))}
      >
        <div className="w-full">
          <div className="text-center mb-8 sm:mb-12 px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-canela text-black mb-4">
              Featured Tailors
            </h2>
            <p className="text-lg sm:text-xl text-black/70 max-w-2xl mx-auto">
              Explore our curated selection of Africa's most skilled tailors
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-oma-plum" />
            </div>
          ) : error ? (
            <div className="text-center text-oma-plum py-8">{error}</div>
          ) : (
            <div className="relative">
              {/* Mobile scroll indicator */}
              <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                <div className="w-2 h-16 bg-gradient-to-b from-oma-gold/60 to-transparent rounded-full"></div>
              </div>
              
              {/* Right edge fade indicator for mobile */}
              <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10"></div>
              
              <div
                ref={tailorsScrollRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory scrollbar-hide px-4 sm:px-6 lg:px-8 mobile-scroll-container"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  scrollPadding: '0 1rem'
                }}
              >
                {tailors.map((tailor, index) => (
                  <Link
                    key={tailor.id}
                    href={tailor.brand ? `/brand/${tailor.brand.id}` : "#"}
                    className="group block snap-center flex-shrink-0 w-[280px] sm:w-[320px] md:w-96 max-w-full bg-gradient-to-br from-white via-oma-beige/30 to-white rounded-2xl shadow-lg border border-oma-beige/40 hover:border-oma-gold/60 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer focus:ring-2 focus:ring-oma-gold mobile-scroll-item"
                    tabIndex={0}
                  >
                    <div className="relative w-full aspect-[3/4] bg-oma-beige/20 overflow-hidden">
                      {tailor.brand ? (
                        <BrandCard
                          id={tailor.brand.id}
                          name={tailor.brand.name}
                          image={tailor.image || tailor.brand.image}
                          category={tailor.brand.category}
                          location={tailor.brand.location}
                          isVerified={tailor.brand.is_verified}
                          video_url={tailor.brand.video_url}
                          video_thumbnail={tailor.brand.video_thumbnail}
                          className="h-full"
                        />
                      ) : (
                        <OptimizedImage
                          src={
                            tailor.image ||
                            "/lovable-uploads/020cb90b-2fee-4db4-a7ee-538515580ef2.png"
                          }
                          alt={tailor.title || "Tailor"}
                          aspectRatio="3/4"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          quality={90}
                          fill
                          onError={() => {
                            console.log(
                              `Image failed to load for tailor: ${tailor.title}`
                            );
                          }}
                        />
                      )}
                    </div>
                    <div className="p-4 sm:p-6 text-center">
                      <h3 className="text-xl sm:text-2xl font-semibold text-black mb-1 group-hover:text-oma-plum transition-colors">
                        {tailor.title || tailor.brand?.name}
                      </h3>
                      <div className="text-oma-cocoa/70 text-sm sm:text-base mb-2">
                        {tailor.brand?.location}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Show preview of next item on mobile */}
                {tailors.length > 1 && (
                  <div className="flex-shrink-0 w-8 sm:w-12 md:w-16"></div>
                )}
              </div>
              
              {/* Scroll hint for mobile */}
              <div className="sm:hidden text-center mt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-oma-cocoa/60">
                  <div className="w-2 h-2 bg-oma-gold/40 rounded-full animate-pulse"></div>
                  <span>Swipe to see more</span>
                  <div className="w-2 h-2 bg-oma-gold/40 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Questions Section */}
      <section
        ref={questionsRef}
        id="questions"
        className="min-h-[120vh] snap-start flex items-center justify-center py-40 px-4 sm:px-10 md:px-20 lg:px-32 relative bg-gradient-to-br from-oma-plum/5 to-oma-gold/5"
      >
        {/* Corner Frames */}
        <div className="absolute top-8 left-2 sm:top-10 sm:left-6 w-10 h-10 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-8 right-2 sm:top-10 sm:right-6 w-10 h-10 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 w-10 h-10 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-6 w-10 h-10 border-r-4 border-b-4 border-oma-gold/80"></div>
        <div
          className="max-w-6xl mx-auto w-full"
          style={getSectionTransform(visibleSections.has("questions"))}
        >
          <div className="text-center mb-16">
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
                question:
                  "Found your wedding fit, suit or dress on Pinterest and want to recreate it?",
                description:
                  "Our tailors can recreate any design you've fallen in love with",
              },
              {
                question: "Need a custom piece for a special occasion?",
                description:
                  "From red carpet events to traditional ceremonies, we've got you covered",
              },
              {
                question:
                  "Struggling to find the perfect fit in ready-to-wear?",
                description:
                  "Get garments tailored exactly to your measurements and preferences",
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

                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-oma-plum"
                  >
                    <path d="M15.5 6v12" />
                    <path d="M19 16v6" />
                    <path d="M5 16v6" />
                    <path d="M1 2v3" />
                    <path d="M23 2v3" />
                  </svg>
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
        className="min-h-[120vh] snap-start flex items-center justify-center py-40 px-4 sm:px-10 md:px-20 lg:px-32 relative"
      >
        {/* Corner Frames */}
        <div className="absolute top-8 left-2 sm:top-10 sm:left-6 w-10 h-10 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-8 right-2 sm:top-10 sm:right-6 w-10 h-10 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 w-10 h-10 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-6 w-10 h-10 border-r-4 border-b-4 border-oma-gold/80"></div>
        <div
          className="max-w-6xl mx-auto w-full h-full flex flex-col items-center justify-center"
          style={getSectionTransform(visibleSections.has("process"))}
        >
          <div className="text-center mb-16">
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
                title: "Choose Your Tailor",
                description:
                  "Browse our curated list of verified tailors and find one whose style resonates with you",
              },
              {
                step: "02",
                title: "Share Your Vision",
                description:
                  "Discuss your ideas, share inspiration photos, and collaborate on the design",
              },
              {
                step: "03",
                title: "Get Measured",
                description:
                  "Provide measurements or schedule a fitting session for the perfect fit",
              },
              {
                step: "04",
                title: "Receive Your Creation",
                description:
                  "Watch your vision come to life with expert craftsmanship and attention to detail",
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
                    className={`w-20 h-20 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10 text-oma-plum"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <path d="M22 3H2v16a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V3z" />
                    </svg>
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
        className="min-h-[120vh] snap-start flex items-center justify-center py-40 px-4 sm:px-10 md:px-20 lg:px-32 relative bg-gradient-to-br from-oma-beige/20 to-white/50"
      >
        {/* Corner Frames */}
        <div className="absolute top-8 left-2 sm:top-10 sm:left-6 w-10 h-10 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-8 right-2 sm:top-10 sm:right-6 w-10 h-10 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 w-10 h-10 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-6 w-10 h-10 border-r-4 border-b-4 border-oma-gold/80"></div>
        <div
          className="max-w-6xl mx-auto w-full"
          style={getSectionTransform(visibleSections.has("benefits"))}
        >
          <div className="text-center mb-16">
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
                title: "Perfect Fit",
                description:
                  "Garments tailored exactly to your body measurements and preferences",
              },
              {
                title: "Unique Design",
                description:
                  "One-of-a-kind pieces that reflect your personal style and vision",
              },
              {
                title: "Premium Quality",
                description:
                  "Expert craftsmanship using high-quality materials and techniques",
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10 text-oma-gold"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M22 17H2v-2a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2z" />
                  </svg>
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
        className="min-h-[120vh] snap-start flex items-center justify-center py-32 px-8 sm:px-16 lg:px-32 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 relative overflow-hidden"
      >
        {/* Corner Frames */}
        <div className="absolute top-24 left-8 w-12 h-12 border-l-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute top-24 right-8 w-12 h-12 border-r-4 border-t-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-oma-gold/80"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-oma-gold/80"></div>
        {/* Background Graphics with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full blur-2xl"
            style={{ transform: `translateY(${window.scrollY * 0.1}px)` }}
          />
          <div
            className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-oma-gold/10 to-oma-plum/10 rounded-full blur-xl"
            style={{ transform: `translateY(${window.scrollY * -0.1}px)` }}
          />
        </div>
        <div
          className="max-w-4xl mx-auto text-center relative z-10 w-full"
          style={getSectionTransform(visibleSections.has("cta"))}
        >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M22 17H2v-2a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2z" />
                </svg>
                Learn More
              </Link>
            </Button>
          </div>

          {/* Final Trust Indicators */}
          <div className="mt-12 flex justify-center gap-8 text-sm text-black/60">
            <div>50+ Verified Tailors</div>
            <div>1000+ Happy Clients</div>
            <div>Expert Craftsmanship</div>
          </div>
        </div>
      </section>
    </div>
  );
}
