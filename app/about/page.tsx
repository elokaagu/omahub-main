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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function About() {
  const [aboutUs, setAboutUs] = useState("");
  const [ourStory, setOurStory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      const { data: aboutData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "about_omahub")
        .single();
      const { data: storyData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "our_story")
        .single();
      setAboutUs(
        aboutData?.value?.trim() ||
          `OmaHub is a premier fashion tech platform dedicated to spotlighting Africa's emerging designers. We're creating a digital space where creativity, craftsmanship, and cultural expression intersect.\n\nOur mission is to connect Africa's innovative fashion talent with a global audience, fostering discovery and celebration of the continent's rich design heritage.`
      );
      setOurStory(
        storyData?.value?.trim() ||
          `OmaHub was born in 2025 from a deep belief: that Africa's designers deserve a global stage on their own terms. Rooted in the meaning of "Oma" (a West African word for beauty), we exist to honour the artistry shaping fashion across the continent.\n\nWhat started as a simple idea, a digital space to spotlight emerging designers, has become a dynamic platform connecting creators to conscious consumers around the world.\n\nOmaHub bridges tradition and innovation. We celebrate the bold, the handmade, and the culturally grounded, helping preserve traditional techniques while championing modern design. More than fashion, this is a movement for craft, community, and creativity.`
      );
      setLoading(false);
    }
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-24 text-oma-plum">
        Loading About OmaHub...
      </div>
    );
  }

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
            {aboutUs.split("\n").map((para, i) => (
              <p key={i} className="text-oma-cocoa text-lg mb-6">
                {para}
              </p>
            ))}
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/directory">Discover Our Brand Directory</Link>
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
            {ourStory.split("\n").map((para, i) => (
              <motion.p key={i} variants={fadeIn} className="text-center">
                {para}
              </motion.p>
            ))}
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
                src="/community.jpg"
                alt="OmaHub Community"
                className="rounded-2xl shadow-lg w-full h-[400px] object-cover"
              />
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
                future events, we're creating opportunities for meaningful
                engagement and discovery.
              </p>
              <a
                href="https://www.instagram.com/_omahub/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-oma-plum hover:bg-oma-plum/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                @omahub
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
