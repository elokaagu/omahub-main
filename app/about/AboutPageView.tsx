"use client";

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

export type AboutPageViewProps = {
  aboutUs: string;
  ourStory: string;
};

export function AboutPageView({ aboutUs, ourStory }: AboutPageViewProps) {
  const aboutParagraphs = toParagraphs(aboutUs);
  const storyParagraphs = toParagraphs(ourStory);

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
              <Image
                src="/lovable-uploads/ecd30635-4578-4835-8c10-63882603a3f1.png"
                alt="African fashion innovation and design showcased on OmaHub"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="py-16 px-6 bg-oma-beige"
      >
        <div className="max-w-3xl mx-auto">
          <SectionHeader title="Our Story" centered={true} />
          <div className="prose prose-lg max-w-none space-y-6">
            {storyParagraphs.map((para, i) => (
              <motion.p key={i} variants={fadeIn} className="text-center">
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
        className="py-16 px-6 max-w-7xl mx-auto"
      >
        <SectionHeader
          title="Our Mission & Values"
          subtitle="Guided by principles that honor creativity, culture, and community"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Celebration</h3>
            <p className="text-oma-cocoa">
              We celebrate the rich diversity of African design, honoring
              traditional techniques while embracing contemporary expressions.
              Every designer on our platform represents a unique voice and
              perspective worth amplifying.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Connection</h3>
            <p className="text-oma-cocoa">
              We build bridges between creators and consumers, between tradition
              and innovation, and between local craftsmanship and global
              appreciation. Our platform facilitates meaningful connections that
              transcend geographical boundaries.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Curation</h3>
            <p className="text-oma-cocoa">
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
        className="py-16 px-6 bg-gradient-to-r from-oma-gold/20 to-oma-cocoa/20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div variants={scaleIn}>
              <div className="relative w-full aspect-[4/3] max-h-[400px] min-h-[240px] rounded-2xl shadow-lg overflow-hidden">
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
              <h2 className="heading-md mb-6">Our Community</h2>
              <p className="text-oma-cocoa text-lg mb-6">
                At the heart of OmaHub is a vibrant community of designers,
                fashion enthusiasts, and cultural advocates who share a passion
                for African design innovation.
              </p>
              <p className="text-oma-cocoa text-lg mb-8">
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
                className="inline-flex items-center justify-center bg-oma-plum hover:bg-oma-plum/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                aria-label="Follow OmaHub on Instagram (@omahub)"
              >
                Follow us on Instagram (@omahub)
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
