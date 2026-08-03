"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const SITE_IMAGES = "/site-images";

const DECORATIVE_IMAGES = [
  {
    src: `${SITE_IMAGES}/Placeholder.png`,
    alt: "Continuous line drawing of three faces in profile",
    width: 640,
    height: 800,
    sizes: "(max-width: 1024px) 100vw, 25vw",
    wrapperClassName: "lg:col-span-3",
  },
  {
    src: `${SITE_IMAGES}/Placeholder-2.png`,
    alt: "Illustrated portrait with bold red circle and coral accents",
    width: 960,
    height: 960,
    sizes: "(max-width: 1024px) 100vw, 42vw",
    wrapperClassName: "lg:col-span-5",
  },
  {
    src: `${SITE_IMAGES}/Placeholder-1.png`,
    alt: "Collage of vintage postage stamp illustrations",
    width: 960,
    height: 640,
    sizes: "(max-width: 1024px) 100vw, 33vw",
    wrapperClassName: "lg:col-span-4",
  },
] as const;

/**
 * Decorative editorial collage — visual texture further down the homepage.
 */
export function EditorialDecorSection() {
  return (
    <section
      aria-label="Editorial artwork"
      className="overflow-hidden bg-oma-beige py-14 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slideInFromRight" duration={0.65}>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
            Visual notes
          </p>
        </AnimateOnScroll>

        <div className="mt-8 grid grid-cols-1 items-end gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-12 lg:gap-5">
          {DECORATIVE_IMAGES.map((item, index) => (
            <AnimateOnScroll
              key={item.src}
              animation="slideInFromRight"
              delay={0.08 + index * 0.12}
              duration={0.7}
              className={item.wrapperClassName}
            >
              <div className="overflow-hidden rounded-2xl ring-1 ring-oma-cocoa/10">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes={item.sizes}
                  className="block h-auto w-full"
                />
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
