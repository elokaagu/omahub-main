"use client";

import { Button } from "@/components/ui/button";
import {
  PageFade,
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";
import { motion } from "framer-motion";
import { useState } from "react";

export default function AnimationDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-canela mb-6">Animation Demo</h1>
        <p className="text-oma-cocoa mb-12">
          Explore the different animation components available in OmaHub
        </p>

        {/* Basic Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-canela mb-4">Basic Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-medium mb-4">Fade In</h3>
              <FadeIn>
                <div className="h-40 bg-oma-cream rounded-lg flex items-center justify-center">
                  <p className="text-oma-plum">Fade In Animation</p>
                </div>
              </FadeIn>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-medium mb-4">Slide Up</h3>
              <SlideUp>
                <div className="h-40 bg-oma-cream rounded-lg flex items-center justify-center">
                  <p className="text-oma-plum">Slide Up Animation</p>
                </div>
              </SlideUp>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-medium mb-4">Scale In</h3>
              <ScaleIn>
                <div className="h-40 bg-oma-cream rounded-lg flex items-center justify-center">
                  <p className="text-oma-plum">Scale In Animation</p>
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* Staggered Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-canela mb-4">Staggered Animations</h2>
          <StaggerContainer>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <StaggerItem key={item}>
                <div className="p-4 mb-3 bg-white rounded-lg shadow-sm">
                  <p className="text-oma-plum">Staggered Item {item}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Interactive Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-canela mb-4">Interactive Animations</h2>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="font-medium mb-4">Click Counter with Animation</h3>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setCount(count + 1)}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                Increment
              </Button>
              <motion.span
                key={count}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 bg-oma-cream rounded-full flex items-center justify-center">
                  <span className="text-oma-plum text-xl">{count}</span>
                </div>
              </motion.span>
              <Button
                onClick={() => setCount(count > 0 ? count - 1 : 0)}
                variant="outline"
                className="border-oma-plum text-oma-plum"
              >
                Decrement
              </Button>
            </div>
          </div>
        </section>

        {/* Page Transition Demo */}
        <section>
          <h2 className="text-2xl font-canela mb-4">Page Transitions</h2>
          <p className="text-oma-cocoa mb-4">
            Navigate between pages to see the smooth page transitions in action.
          </p>
          <div className="flex gap-4">
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <a href="/">Go to Homepage</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum"
            >
              <a href="/directory">Go to Directory</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
