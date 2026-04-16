"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  fadeIn,
  staggerChildren,
  slideIn,
  scaleIn,
} from "@/app/utils/animations";
import { toParagraphs } from "@/lib/content/about";
import type { LoginHeroSlide } from "@/lib/brands/getLoginHeroBrandSlides";

export type AboutPageViewProps = {
  aboutUs: string;
  ourStory: string;
  brandSlides: LoginHeroSlide[];
};

const FALLBACK_IMAGE = "/lovable-uploads/ecd30635-4578-4835-8c10-63882603a3f1.png";
const AUTOPLAY_MS = 4800;

export function AboutPageView({
  aboutUs,
  ourStory,
  brandSlides,
}: AboutPageViewProps) {
  const aboutParagraphs = toParagraphs(aboutUs);
  const storyParagraphs = toParagraphs(ourStory);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = useMemo(() => {
    if (brandSlides.length > 0) return brandSlides;
    return [
      {
        brandId: "fallback",
        brandName: "OmaHub",
        imageUrl: FALLBACK_IMAGE,
      },
    ];
  }, [brandSlides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="pt-24 pb-16 px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div variants={slideIn} className="order-2 lg:order-1">
            <h1 className="heading-lg mb-6">About OmaHub</h1>
            {aboutParagraphs.map((para, i) => (
              <p key={i} className="text-oma-cocoa text-lg mb-6">
                {para}
              </p>
            ))}
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/directory">Discover Our Brand Directory</Link>
            </Button>
          </motion.div>
          <motion.div variants={scaleIn} className="order-1 lg:order-2">
            <div className="relative w-full aspect-[4/5] max-h-[600px] min-h-[280px] rounded-2xl shadow-lg overflow-hidden">
              {slides.map((slide, idx) => (
                <Image
                  key={`${slide.brandId}-${idx}`}
                  src={slide.imageUrl}
                  alt={`${slide.brandName} showcased on OmaHub`}
                  fill
                  className={`object-cover transition-opacity duration-700 ${
                    idx === activeSlide ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={idx === 0}
                />
              ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent px-5 pb-5 pt-16">
                <p className="text-sm font-medium text-white/95">
                  {slides[activeSlide]?.brandName ?? "OmaHub"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="relative overflow-hidden py-20 px-6 bg-oma-beige"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-oma-gold/10 blur-3xl" />
          <div className="absolute -left-16 bottom-10 h-36 w-36 rounded-full bg-oma-cocoa/10 blur-3xl" />
          <div className="absolute -right-16 top-16 h-36 w-36 rounded-full bg-oma-plum/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div variants={fadeIn} className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-oma-cocoa/60 mb-3">
              The Journey
            </p>
            <SectionHeader title="Our Story" centered={true} />
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-oma-gold/70 to-transparent" />
          </motion.div>

          <div className="rounded-3xl border border-oma-gold/20 bg-white/60 backdrop-blur-sm shadow-[0_16px_40px_rgba(60,34,36,0.08)] p-7 sm:p-10 lg:p-12">
            {storyParagraphs.map((para, i) => (
              <motion.p
                key={i}
                variants={fadeIn}
                className="mx-auto max-w-3xl text-center text-base leading-8 text-oma-cocoa sm:text-lg sm:leading-9"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="relative py-20 px-6 max-w-7xl mx-auto"
      >
        <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-32 w-72 rounded-full bg-oma-gold/10 blur-3xl" />

        <div className="relative">
          <SectionHeader
            title="Our Mission & Values"
            subtitle="Guided by principles that honor creativity, culture, and community"
          />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-10">
          <motion.div
            variants={fadeIn}
            className="group rounded-2xl border border-oma-gold/20 bg-gradient-to-b from-white to-oma-cream/70 p-7 shadow-[0_14px_28px_rgba(60,34,36,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(60,34,36,0.1)]"
          >
            <div className="mb-4 h-px w-14 bg-gradient-to-r from-oma-gold/70 to-transparent transition-all duration-300 group-hover:w-20" />
            <h3 className="font-canela text-3xl leading-tight mb-4">Celebration</h3>
            <p className="text-oma-cocoa/90 leading-8 text-[1.03rem]">
              We celebrate the rich diversity of African design, honoring
              traditional techniques while embracing contemporary expressions.
              Every designer on our platform represents a unique voice and
              perspective worth amplifying.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="group rounded-2xl border border-oma-gold/20 bg-gradient-to-b from-white to-oma-cream/70 p-7 shadow-[0_14px_28px_rgba(60,34,36,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(60,34,36,0.1)]"
          >
            <div className="mb-4 h-px w-14 bg-gradient-to-r from-oma-gold/70 to-transparent transition-all duration-300 group-hover:w-20" />
            <h3 className="font-canela text-3xl leading-tight mb-4">Connection</h3>
            <p className="text-oma-cocoa/90 leading-8 text-[1.03rem]">
              We build bridges between creators and consumers, between tradition
              and innovation, and between local craftsmanship and global
              appreciation. Our platform facilitates meaningful connections that
              transcend geographical boundaries.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="group rounded-2xl border border-oma-gold/20 bg-gradient-to-b from-white to-oma-cream/70 p-7 shadow-[0_14px_28px_rgba(60,34,36,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(60,34,36,0.1)]"
          >
            <div className="mb-4 h-px w-14 bg-gradient-to-r from-oma-gold/70 to-transparent transition-all duration-300 group-hover:w-20" />
            <h3 className="font-canela text-3xl leading-tight mb-4">Curation</h3>
            <p className="text-oma-cocoa/90 leading-8 text-[1.03rem]">
              We carefully curate our brand directory to showcase designers who
              demonstrate excellence in their craft, authenticity in their
              vision, and commitment to ethical practices. Our verification
              process ensures a standard of quality our community can trust.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="relative overflow-hidden py-20 px-6 bg-gradient-to-r from-oma-gold/20 to-oma-cocoa/20"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -right-10 bottom-6 h-40 w-40 rounded-full bg-oma-plum/20 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl border border-white/35 bg-white/40 p-5 sm:p-7 lg:p-9 shadow-[0_22px_48px_rgba(60,34,36,0.14)] backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
              <motion.div variants={scaleIn}>
                <div className="relative w-full aspect-[4/3] max-h-[420px] min-h-[240px] rounded-2xl shadow-lg overflow-hidden ring-1 ring-black/5">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/95 backdrop-blur">
                    Community
                  </div>
                  <Image
                    src="/community.jpg"
                    alt="OmaHub community of designers and fashion enthusiasts"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </motion.div>
              <motion.div variants={slideIn}>
                <p className="text-xs uppercase tracking-[0.24em] text-oma-cocoa/65 mb-3">
                  People Powered
                </p>
                <h2 className="heading-md mb-6">Our Community</h2>
                <p className="text-oma-cocoa text-lg leading-8 mb-6">
                  At the heart of OmaHub is a vibrant community of designers,
                  fashion enthusiasts, and cultural advocates who share a passion
                  for African design innovation.
                </p>
                <p className="text-oma-cocoa text-lg leading-8 mb-8">
                  We provide a platform where this community can connect,
                  collaborate, and collectively elevate African fashion on the
                  global stage. Through our brand directory, newsletters, and
                  future events, we&apos;re creating opportunities for meaningful
                  engagement and discovery.
                </p>
                <a
                  href="https://www.instagram.com/_omahub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-oma-plum px-7 py-3.5 font-medium text-white shadow-[0_12px_24px_rgba(60,34,36,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-oma-plum/90 hover:shadow-[0_16px_26px_rgba(60,34,36,0.34)]"
                  aria-label="Follow OmaHub on Instagram (@omahub)"
                >
                  Follow us on Instagram (@omahub)
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
