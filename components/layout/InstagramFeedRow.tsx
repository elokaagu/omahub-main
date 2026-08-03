"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import type { InstagramPost } from "@/lib/instagram/types";
import {
  OMAHUB_INSTAGRAM_HANDLE,
  OMAHUB_INSTAGRAM_URL,
} from "@/lib/instagram/types";

type InstagramFeedRowProps = {
  posts: InstagramPost[];
};

function truncateCaption(caption: string, maxLength = 90): string {
  const trimmed = caption.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function InstagramFeedRow({ posts }: InstagramFeedRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollIndicators();
    const handleResize = () => updateScrollIndicators();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [posts]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 220 : 260;
    const cardsToScroll = isMobile ? 1.5 : 3;
    const scrollAmount = cardWidth * cardsToScroll;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              On Instagram
            </p>
            <h2 className="mt-2 font-canela text-2xl text-oma-black sm:text-3xl md:text-4xl">
              Latest from the hub
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-oma-cocoa/80 sm:text-base">
              Editions, designers, and moments from the OmaHub community.
            </p>
          </div>
          <a
            href={OMAHUB_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 border-b border-oma-plum/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-plum transition-colors hover:border-oma-plum hover:text-oma-cocoa"
          >
            <Instagram className="h-4 w-4" aria-hidden />
            Follow {OMAHUB_INSTAGRAM_HANDLE}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateScrollIndicators}
          className="brand-row-scroll flex snap-x snap-mandatory scroll-smooth gap-3 overflow-x-auto pb-4 pl-4 scrollbar-hide sm:gap-4 sm:pl-6 lg:pl-8"
        >
          {posts.map((post, index) => (
            <AnimateOnScroll
              key={post.id}
              animation="slideInFromRight"
              delay={index * 0.08}
              duration={0.65}
            >
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  post.caption
                    ? `View Instagram post: ${truncateCaption(post.caption, 60)}`
                    : "View Instagram post"
                }
                className="group relative block w-[220px] flex-none snap-start overflow-hidden rounded-2xl bg-oma-plum/5 ring-1 ring-oma-cocoa/10 transition-shadow duration-300 hover:shadow-lg sm:w-[240px] lg:w-[260px]"
              >
                <div className="relative aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/80 via-oma-plum/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {post.caption ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-white">
                        {truncateCaption(post.caption)}
                      </p>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                        View post
                      </span>
                    )}
                    <Instagram
                      className="h-5 w-5 shrink-0 text-white"
                      aria-hidden
                    />
                  </div>
                  {post.mediaType === "VIDEO" && (
                    <span className="absolute right-3 top-3 rounded-full bg-oma-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                      Reel
                    </span>
                  )}
                  {post.mediaType === "CAROUSEL_ALBUM" && (
                    <span className="absolute right-3 top-3 rounded-full bg-oma-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                      Album
                    </span>
                  )}
                </div>
              </a>
            </AnimateOnScroll>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll Instagram posts left"
          className={cn(
            "absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-oma-cocoa/20 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-oma-plum lg:hidden",
            !canScrollLeft && "cursor-not-allowed opacity-50",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll Instagram posts right"
          className={cn(
            "absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-oma-cocoa/20 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-oma-plum lg:hidden",
            !canScrollRight && "cursor-not-allowed opacity-50",
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
