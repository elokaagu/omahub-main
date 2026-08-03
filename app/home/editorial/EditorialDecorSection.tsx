"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const SITE_IMAGES = "/site-images";

const DECORATIVE_IMAGES = [
  {
    src: `${SITE_IMAGES}/Placeholder.png`,
    alt: "Continuous line drawing of three faces in profile",
    sizes: "(max-width: 1024px) 100vw, 25vw",
    wrapperClassName: "lg:col-span-3",
    imageClassName: "object-contain object-bottom",
    aspectClassName: "aspect-[3/4] sm:aspect-[4/5]",
  },
  {
    src: `${SITE_IMAGES}/Placeholder-2.png`,
    alt: "Illustrated portrait with bold red circle and coral accents",
    sizes: "(max-width: 1024px) 100vw, 42vw",
    wrapperClassName: "lg:col-span-5",
    imageClassName: "object-cover object-center",
    aspectClassName: "aspect-[4/3] sm:aspect-[5/4]",
  },
  {
    src: `${SITE_IMAGES}/Placeholder-1.png`,
    alt: "Collage of vintage postage stamp illustrations",
    sizes: "(max-width: 1024px) 100vw, 33vw",
    wrapperClassName: "lg:col-span-4",
    imageClassName: "object-contain object-center",
    aspectClassName: "aspect-[4/3]",
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

        <div className="mt-8 grid grid-cols-1 items-end gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          {DECORATIVE_IMAGES.map((item, index) => (
            <AnimateOnScroll
              key={item.src}
              animation="slideInFromRight"
              delay={0.08 + index * 0.12}
              duration={0.7}
              className={item.wrapperClassName}
            >
              <div
                className={`relative overflow-hidden rounded-2xl bg-oma-cream/60 shadow-sm ring-1 ring-oma-cocoa/10 ${item.aspectClassName}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={item.sizes}
                  className={item.imageClassName}
                />
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
