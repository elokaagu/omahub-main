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
            <h1 className="heading-lg mb-6">About Oma Hub</h1>
            <p className="text-oma-cocoa text-lg mb-6">
              Oma Hub is a premier fashion-tech platform dedicated to
              spotlighting Africa&apos;s emerging designers. We&apos;re creating
              a digital space where creativity, craftsmanship, and cultural
              expression intersect.
            </p>
            <p className="text-oma-cocoa text-lg mb-8">
              Our mission is to connect Africa&apos;s innovative fashion talent
              with a global audience, fostering discovery and celebration of the
              continent&apos;s rich design heritage.
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
              Oma Hub was born in 2025 from a deep belief: that Africa&apos;s
              designers deserve a global stage on their own terms. Rooted in the
              meaning of &ldquo;Oma&rdquo; - a West African word for beauty, we
              exist to honour the artistry shaping fashion across the continent.
            </motion.p>
            <motion.p variants={fadeIn} className="text-center">
              What started as a simple idea - a digital space to spotlight
              emerging designers, has become a dynamic platform connecting
              creators to conscious consumers around the world.
            </motion.p>
            <motion.p variants={fadeIn} className="text-center">
              Oma Hub bridges tradition and innovation. We celebrate the bold,
              the handmade, and the culturally grounded - helping preserve
              traditional techniques while championing modern design. More than
              fashion, this is a movement for craft, community, and creativity.
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
              We build bridges between creators and consumers, between heritage
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
              We carefully curate our directory to showcase designers who
              demonstrate excellence in their craft, authenticity in their
              vision, and commitment to ethical practices. Our verification
              process ensures a standard of quality our community can trust.
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
