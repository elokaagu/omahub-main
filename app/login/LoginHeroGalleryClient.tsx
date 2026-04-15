"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { LoginHeroSlide } from "@/lib/brands/getLoginHeroBrandSlides";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const FALLBACK_SLIDES: LoginHeroSlide[] = [
  {
    brandId: "fallback-1",
    brandName: "OmaHub",
    imageUrl: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
  },
  {
    brandId: "fallback-2",
    brandName: "OmaHub",
    imageUrl: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
  },
  {
    brandId: "fallback-3",
    brandName: "OmaHub",
    imageUrl: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
  },
];

const AUTOPLAY_MS = 5200;

function buildEffectiveSlides(slides: LoginHeroSlide[]): LoginHeroSlide[] {
  if (slides.length === 0) return FALLBACK_SLIDES;
  if (slides.length >= 3) return slides;
  const seen = new Set(slides.map((s) => s.imageUrl));
  const out = [...slides];
  for (const f of FALLBACK_SLIDES) {
    if (out.length >= 6) break;
    if (!seen.has(f.imageUrl)) {
      seen.add(f.imageUrl);
      out.push(f);
    }
  }
  return out;
}

type LoginHeroGalleryClientProps = {
  slides: LoginHeroSlide[];
};

export function LoginHeroGalleryClient({ slides }: LoginHeroGalleryClientProps) {
  const effective = buildEffectiveSlides(slides);
  const [api, setApi] = useState<CarouselApi | null>(null);

  const onApi = useCallback((instance: CarouselApi | null) => {
    setApi(instance);
  }, []);

  useEffect(() => {
    if (!api) return;
    const id = window.setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [api]);

  return (
    <div className="relative hidden h-full min-h-[calc(100vh-5rem)] flex-1 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F2F0EC] to-oma-beige/40 px-6 py-12 lg:flex xl:px-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 28%, rgba(58,30,45,0.07) 0%, transparent 42%), radial-gradient(circle at 82% 72%, rgba(212,178,133,0.14) 0%, transparent 45%)",
        }}
      />

      <div className="relative z-[1] mx-auto mt-2 flex w-full max-w-xl flex-1 flex-col justify-center">
        <Carousel
          setApi={onApi}
          opts={{
            loop: effective.length > 2,
            align: "center",
            skipSnaps: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {effective.map((slide, index) => (
              <CarouselItem
                key={`${slide.brandId}-${index}`}
                className="basis-full pl-2 md:pl-3"
              >
                <div className="relative mx-auto aspect-[4/5] w-[88%] max-w-md overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
                  <Image
                    src={slide.imageUrl}
                    alt={`${slide.brandName} — featured on OmaHub`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 38vw, 0px"
                    priority={index === 0}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pb-4 pt-16">
                    <p className="font-medium text-white drop-shadow-sm">
                      {slide.brandName}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="relative z-[2] mt-8 max-w-md space-y-1.5 text-oma-black">
        <p className="font-canela text-xl leading-snug tracking-tight text-oma-plum md:text-2xl">
          Fashion that feels curated, not crowded.
        </p>
        <p className="text-sm text-oma-cocoa/90">
          Discover designers and tailors on{" "}
          <span className="font-semibold text-oma-plum">OmaHub</span>
        </p>
      </div>
    </div>
  );
}
