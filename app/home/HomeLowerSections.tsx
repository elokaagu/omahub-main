"use client";

import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import dynamic from "next/dynamic";
import { FadeIn, SlideUp } from "@/app/components/ui/animations";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import type { SpotlightContent } from "@/lib/services/spotlightService";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";
import type { CategoryWithBrands } from "@/app/home/homeTypes";

const VideoPlayer = dynamic(
  () =>
    import("@/components/ui/video-player").then((m) => ({
      default: m.VideoPlayer,
    })),
  { ssr: false, loading: () => <div className="h-[500px] w-full animate-pulse bg-oma-beige/40 rounded-2xl" /> }
);

export type HomeLowerSectionsProps = {
  categories: CategoryWithBrands[];
  categoryImages: {
    collectionImage: string;
    tailoredImage: string;
  };
  spotlightContent: SpotlightContent | null;
  occasionImages: Record<string, string>;
};

export default function HomeLowerSections({
  categories,
  categoryImages,
  spotlightContent,
  occasionImages,
}: HomeLowerSectionsProps) {
  return (
    <>
      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-canela text-center">
              Browse by Category
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FadeIn delay={0.1}>
              <div className="relative group overflow-hidden rounded-lg bg-gray-100 min-h-[400px]">
                <Link href="/collections">
                  <div className="relative aspect-[3/4]">
                    {categoryImages.collectionImage ? (
                      <img
                        src={categoryImages.collectionImage}
                        alt="Collections"
                        className="w-full h-full object-cover object-center object-top transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                        No Collection Image Available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-canela mb-2">Collections</h3>
                      <p className="text-sm">
                        Shop for an occasion, holiday, or ready to wear piece
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="relative group overflow-hidden rounded-lg bg-gray-100 min-h-[400px]">
                <Link href="/tailored">
                  <div className="relative aspect-[3/4]">
                    {categoryImages.tailoredImage ? (
                      <img
                        src={categoryImages.tailoredImage}
                        alt="Tailored"
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                        No Tailored Image Available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-canela mb-2">Tailored</h3>
                      <p className="text-sm">
                        Masters of craft creating perfectly fitted garments
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {spotlightContent && (
        <section className="py-12 bg-oma-beige relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
            <FadeIn>
              <SectionHeader
                title={spotlightContent.title}
                subtitle={spotlightContent.subtitle}
                titleClassName="text-2xl md:text-3xl font-canela"
                subtitleClassName="text-base text-oma-cocoa/80"
              />
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-8">
              <SlideUp delay={0.2}>
                <div className="rounded-2xl overflow-hidden relative group">
                  {spotlightContent.video_url ? (
                    <VideoPlayer
                      videoUrl={spotlightContent.video_url}
                      thumbnailUrl={
                        spotlightContent.video_thumbnail &&
                        !spotlightContent.video_thumbnail.includes(".mp4") &&
                        !spotlightContent.video_thumbnail.includes(".mov") &&
                        !spotlightContent.video_thumbnail.includes(".avi")
                          ? spotlightContent.video_thumbnail
                          : undefined
                      }
                      fallbackImageUrl={
                        spotlightContent.main_image &&
                        !spotlightContent.main_image.includes(".mp4") &&
                        !spotlightContent.main_image.includes(".mov") &&
                        !spotlightContent.main_image.includes(".avi")
                          ? spotlightContent.main_image
                          : "/placeholder.jpg"
                      }
                      alt={`${spotlightContent.brand_name} collection`}
                      className="w-full h-[500px] transition-transform duration-700 group-hover:scale-105"
                      aspectRatio="3/4"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={95}
                      priority={true}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      showPlayButton={false}
                      onVideoError={() => {
                        console.warn(
                          "Video failed to load for spotlight content"
                        );
                      }}
                    />
                  ) : (
                    <LazyImage
                      src={spotlightContent?.main_image || "/placeholder.jpg"}
                      alt={`${spotlightContent?.brand_name || "Brand"} collection`}
                      width={800}
                      height={1000}
                      className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                      aspectRatio="3/4"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={85}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-oma-black/70 via-oma-black/30 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white pointer-events-none">
                    <p className="font-canela italic text-xl md:text-2xl">
                      &ldquo;
                      {spotlightContent?.brand_quote ||
                        "Discover amazing fashion"}
                      &rdquo;
                    </p>
                  </div>
                </div>
              </SlideUp>

              <SlideUp delay={0.4}>
                <div className="flex flex-col h-full justify-center">
                  <h3 className="font-canela text-3xl md:text-4xl mb-6 text-oma-plum italic">
                    {spotlightContent.brand_name}
                  </h3>
                  <p className="text-oma-cocoa mb-6 text-lg">
                    {spotlightContent.brand_description}
                  </p>

                  <div className="mt-4 flex flex-col gap-6">
                    <div className="p-5 border-l-2 border-oma-gold bg-white/70 rounded-r-lg">
                      <p className="italic text-oma-cocoa/80 text-lg">
                        &ldquo;{spotlightContent.brand_quote}&rdquo;
                      </p>
                      <p className="text-sm text-oma-cocoa/60 mt-2">
                        — {spotlightContent.brand_quote_author}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="bg-oma-plum hover:bg-oma-plum/90 w-fit mt-4"
                    >
                      <Link href={spotlightContent.brand_link}>
                        See the Collection
                      </Link>
                    </Button>
                  </div>
                </div>
              </SlideUp>
            </div>

            {spotlightContent.featured_products &&
              spotlightContent.featured_products.length > 0 && (
                <div className="mt-12">
                  <FadeIn delay={0.2}>
                    <h4 className="font-canela text-xl mb-4 text-oma-cocoa/80">
                      Featured Pieces from {spotlightContent.brand_name}
                    </h4>
                  </FadeIn>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {spotlightContent.featured_products.map((product, i) => (
                      <Link
                        key={i}
                        href={spotlightContent.brand_link}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <LazyImage
                          src={product.image}
                          alt={`${spotlightContent.brand_name} ${product.name}`}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          aspectRatio="4/3"
                          sizes="400px"
                          quality={80}
                        />
                        <div className="p-4">
                          <h5 className="font-medium text-oma-black group-hover:text-oma-plum transition-colors">
                            {product.name}
                          </h5>
                          <p className="text-sm text-oma-cocoa/70">
                            {product.collection}
                          </p>
                          <span className="text-sm text-oma-plum mt-2 inline-block">
                            View Collection →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-oma-beige/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-canela text-center mb-8">
            What are you dressing for?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Wedding",
                image:
                  occasionImages.Wedding ||
                  "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
                href: "/directory?occasion=Wedding",
              },
              {
                title: "Party",
                image:
                  occasionImages.Party ||
                  "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
                href: "/directory?occasion=Party",
              },
              {
                title: "Ready to Wear",
                image:
                  occasionImages["Ready to Wear"] ||
                  "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
                href: "/directory?occasion=Ready+to+Wear",
              },
              {
                title: "Vacation",
                image:
                  occasionImages.Vacation ||
                  "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
                href: "/directory?occasion=Vacation",
              },
            ].map((occasion, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <Link href={occasion.href} className="group">
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <LazyImage
                      src={occasion.image}
                      alt={occasion.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      aspectRatio="square"
                      quality={80}
                    />
                    <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-medium">{occasion.title}</h3>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        categories.map((category, index) => (
          <section
            key={category.title}
            className={`py-6 sm:py-8 ${
              index % 2 === 0 ? "bg-white" : "bg-oma-beige/20"
            }`}
          >
            <FadeIn delay={0.1}>
              <FullWidthBrandRow
                title={category.title}
                subtitle={category.customCta}
                brands={category.brands.map((brand) => ({
                  id: brand.id,
                  name: brand.name,
                  image: brand.image,
                  category: brand.category,
                  location: brand.location,
                  rating: brand.rating,
                  isVerified: brand.isVerified,
                  video_url: brand.video_url,
                  video_thumbnail: brand.video_thumbnail,
                }))}
              />
            </FadeIn>

            <SlideUp delay={0.3}>
              <div className="mt-4 text-center px-2 sm:px-4 lg:px-6">
                <Button
                  asChild
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white min-h-[44px] text-sm sm:text-base"
                >
                  <Link
                    href={`/directory?category=${encodeURIComponent(
                      category.title
                    )}`}
                  >
                    View All {category.title}
                  </Link>
                </Button>
              </div>
            </SlideUp>
          </section>
        ))
      ) : (
        <section className="py-8 bg-oma-cream">
          <div className="px-2 sm:px-4 lg:px-6">
            <FadeIn>
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm max-w-7xl mx-auto">
                <p className="text-oma-cocoa text-lg">
                  Loading brand categories...
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-10 px-2 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-6 sm:p-8 md:p-12 text-center">
              <h2 className="font-canela text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
                Ready to Create Something Beautiful?
              </h2>
              <p className="text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Join our community of fashion enthusiasts and talented designers
                bringing creativity to the world.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                <Button
                  asChild
                  className="bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base"
                >
                  <Link href="/directory">Browse Brand Directory</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white min-h-[44px] text-sm sm:text-base"
                >
                  <Link href="/join">Become a Designer</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
