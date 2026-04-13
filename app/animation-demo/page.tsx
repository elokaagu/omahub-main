"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from "@/app/components/ui/animations";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type ComponentType, type ReactNode } from "react";

type BasicDemo = {
  title: string;
  label: string;
  Wrapper: ComponentType<{ children: ReactNode }>;
};

const BASIC_DEMOS: BasicDemo[] = [
  {
    title: "Fade In",
    label: "Fade In Animation",
    Wrapper: FadeIn,
  },
  {
    title: "Slide Up",
    label: "Slide Up Animation",
    Wrapper: SlideUp,
  },
  {
    title: "Scale In",
    label: "Scale In Animation",
    Wrapper: ScaleIn,
  },
];

export default function AnimationDemo() {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-canela mb-6">Animation Demo</h1>
        <p className="text-oma-cocoa mb-12">
          Explore the different animation components available in OmaHub.
          Primitives respect{" "}
          <span className="font-medium text-oma-cocoa">
            prefers-reduced-motion
          </span>
          .
        </p>

        {prefersReducedMotion && (
          <p
            className="mb-8 text-sm text-oma-cocoa/80 border border-oma-gold/30 bg-oma-cream/50 rounded-lg px-4 py-3"
            role="status"
          >
            Reduced motion is enabled in your system settings; animations run
            without movement or with minimal transition.
          </p>
        )}

        <section className="mb-16">
          <h2 className="text-2xl font-canela mb-4">Basic Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BASIC_DEMOS.map(({ title, label, Wrapper }) => (
              <div
                key={title}
                className="p-6 bg-white rounded-lg shadow-md"
              >
                <h3 className="font-medium mb-4">{title}</h3>
                <Wrapper>
                  <div className="h-40 bg-oma-cream rounded-lg flex items-center justify-center">
                    <p className="text-oma-plum">{label}</p>
                  </div>
                </Wrapper>
              </div>
            ))}
          </div>
        </section>

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

        <section className="mb-16">
          <h2 className="text-2xl font-canela mb-4">Interactive Animations</h2>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="font-medium mb-4">Click Counter with Animation</h3>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setCount((c) => c + 1)}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                Increment
              </Button>
              <motion.div
                key={count}
                initial={
                  prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }
                }
                className="w-16 h-16 bg-oma-cream rounded-full flex items-center justify-center"
              >
                <span className="text-oma-plum text-xl">{count}</span>
              </motion.div>
              <Button
                onClick={() => setCount((c) => (c > 0 ? c - 1 : 0))}
                variant="outline"
                className="border-oma-plum text-oma-plum"
              >
                Decrement
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-canela mb-4">Page Transitions</h2>
          <p className="text-oma-cocoa mb-4">
            Navigate between pages to see smooth client-side transitions.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/">Go to Homepage</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum"
            >
              <Link href="/directory">Go to Directory</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
