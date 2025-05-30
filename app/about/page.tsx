"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  fadeIn,
  staggerChildren,
  slideIn,
  scaleIn,
} from "@/app/utils/animations";

export default function About() {
  return (
    <>
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="pt-24 pb-16 px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div variants={slideIn} className="order-2 lg:order-1">
            <h1 className="heading-lg mb-6">About OmaHub</h1>
            <p className="text-oma-cocoa text-lg mb-6">
              OmaHub is a premier fashion-tech platform where craftsmanship
              meets personalization. We connect discerning clients with
              exceptional designers who create both ready-to-wear collections
              and bespoke pieces tailored to individual preferences.
            </p>
            <p className="text-oma-cocoa text-lg mb-8">
              Our mission is to elevate the fashion experience through
              personalization, quality craftsmanship, and innovative technology,
              making exceptional design accessible to fashion lovers worldwide.
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/directory">Discover Our Designers</Link>
            </Button>
          </motion.div>
          <motion.div variants={scaleIn} className="order-1 lg:order-2">
            <img
              src="/lovable-uploads/ecd30635-4578-4835-8c10-63882603a3f1.png"
              alt="African Fashion Innovation"
              className="rounded-2xl shadow-lg w-full h-[600px] object-cover"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Our Story Section */}
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
            <motion.p variants={fadeIn} className="text-center">
              OmaHub was born from a vision to transform the fashion experience
              through personalization and craftsmanship. We believe that truly
              great fashion should be both beautifully crafted and perfectly
              fitted to each individual.
            </motion.p>
            <motion.p variants={fadeIn} className="text-center">
              What started as a platform for connecting clients with skilled
              designers has evolved into a comprehensive fashion ecosystem that
              celebrates individuality, craftsmanship, and innovation.
            </motion.p>
            <motion.p variants={fadeIn} className="text-center">
              Today, OmaHub stands at the intersection of traditional
              craftsmanship and modern technology, offering both curated
              collections and personalized fashion experiences that cater to
              diverse styles and occasions.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Mission & Values Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="py-16 px-6 max-w-7xl mx-auto"
      >
        <SectionHeader
          title="Our Mission & Values"
          subtitle="Guided by principles that honor creativity, craftsmanship, and individuality"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Personalization</h3>
            <p className="text-oma-cocoa">
              We believe in fashion that's made for you. Whether through bespoke
              tailoring or curated collections, every piece should reflect
              individual style and fit perfectly.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Craftsmanship</h3>
            <p className="text-oma-cocoa">
              We celebrate the art of fashion through exceptional craftsmanship,
              attention to detail, and a commitment to quality in every stitch
              and seam.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="bg-oma-cream p-6 rounded-lg shadow-sm border border-oma-gold/10"
          >
            <h3 className="font-canela text-2xl mb-4">Innovation</h3>
            <p className="text-oma-cocoa">
              We embrace technology to enhance the fashion experience, making it
              easier to find, customize, and receive perfectly fitted garments.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Community Section */}
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
              <img
                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=1400"
                alt="Oma Hub Community"
                className="rounded-2xl shadow-lg w-full h-[400px] object-cover"
              />
            </motion.div>
            <motion.div variants={slideIn}>
              <h2 className="heading-md mb-6">Our Community</h2>
              <p className="text-oma-cocoa text-lg mb-6">
                At the heart of Oma Hub is a vibrant community of designers,
                fashion enthusiasts, and cultural advocates who share a passion
                for African design innovation.
              </p>
              <p className="text-oma-cocoa text-lg mb-8">
                We provide a platform where this community can connect,
                collaborate, and collectively elevate African fashion on the
                global stage. Through our directory, newsletters, and future
                events, we&apos;re creating opportunities for meaningful
                engagement and discovery.
              </p>
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <Link href="/join">Join Our Community</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
