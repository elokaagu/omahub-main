"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Carousel } from "@/components/ui/carousel-custom";
import { CategoryCard } from "@/components/ui/category-card";

const carouselItems = [
  {
    id: 1,
    image: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    title: "New Season Collections",
    subtitle:
      "Tailored looks for weddings, travel, and every moment in between.",
    link: "/directory?category=Ready to Wear",
    heroTitle: "Made to Measure. Made to Remember.",
  },
  {
    id: 2,
    image: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    title: "Modern African Bridal",
    subtitle:
      "Tailored looks for weddings, travel, and every moment in between.",
    link: "/directory?category=Bridal",
    heroTitle: "Made to Measure. Made to Remember.",
  },
  {
    id: 3,
    image: "/lovable-uploads/de2841a8-58d1-4fd4-adfa-8c9aa09e9bb2.png",
    title: "Spotlight: Lagos Fashion Week",
    subtitle:
      "Tailored looks for weddings, travel, and every moment in between.",
    link: "/directory?category=Ready to Wear",
    heroTitle: "Made to Measure. Made to Remember.",
  },
];

const categories = [
  {
    title: "Bridal",
    image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    href: "/directory?category=Bridal",
    customCta: 'Tailored for "Yes."',
    brands: [
      {
        id: "zora-atelier",
        name: "Zora Atelier",
        image: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
        location: "Nairobi",
        rating: 4.9,
        isVerified: true,
        category: "Bridal",
      },
      {
        id: "algiers-style",
        name: "Algiers Style",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
        location: "Algiers",
        rating: 4.5,
        isVerified: true,
        category: "Bridal",
      },
      {
        id: "cairo-couture",
        name: "Cairo Couture",
        image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
        location: "Cairo",
        rating: 4.8,
        isVerified: true,
        category: "Bridal",
      },
      {
        id: "lagos-bridal",
        name: "Lagos Bridal House",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
        location: "Lagos",
        rating: 4.7,
        isVerified: true,
        category: "Bridal",
      },
    ],
  },
  {
    title: "Ready to Wear",
    image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    href: "/directory?category=Ready to Wear",
    customCta: "Looks for the every day that isn't.",
    brands: [
      {
        id: "dakar-fashion",
        name: "Dakar Fashion House",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
        location: "Dakar",
        rating: 4.7,
        isVerified: true,
        category: "Ready to Wear",
      },
      {
        id: "nairobi-couture",
        name: "Nairobi Couture",
        image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
        location: "Nairobi",
        rating: 4.6,
        isVerified: true,
        category: "Ready to Wear",
      },
      {
        id: "accra-fashion",
        name: "Accra Fashion",
        image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
        location: "Accra",
        rating: 4.8,
        isVerified: true,
        category: "Ready to Wear",
      },
      {
        id: "afrochic",
        name: "AfroChic",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
        location: "Dakar",
        rating: 4.7,
        isVerified: false,
        category: "Ready to Wear",
      },
    ],
  },
  {
    title: "Tailoring",
    image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    href: "/directory?category=Tailoring",
    customCta: "Custom fits. Clean lines.",
    brands: [
      {
        id: "tunis-tailors",
        name: "Tunis Master Tailors",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
        location: "Tunis",
        rating: 4.9,
        isVerified: true,
        category: "Tailoring",
      },
      {
        id: "casablanca-cuts",
        name: "Casablanca Cuts",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
        location: "Casablanca",
        rating: 4.8,
        isVerified: true,
        category: "Tailoring",
      },
      {
        id: "lagos-bespoke",
        name: "Lagos Bespoke",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
        location: "Lagos",
        rating: 4.7,
        isVerified: true,
        category: "Tailoring",
      },
      {
        id: "addis-tailoring",
        name: "Addis Fine Tailoring",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
        location: "Addis Ababa",
        rating: 4.8,
        isVerified: true,
        category: "Tailoring",
      },
    ],
  },
  {
    title: "Accessories",
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    href: "/directory?category=Accessories",
    customCta: "The extras that make it extra.",
    brands: [
      {
        id: "beads-by-nneka",
        name: "Beads by Nneka",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
        location: "Abuja",
        rating: 4.9,
        isVerified: true,
        category: "Accessories",
      },
      {
        id: "marrakech-textiles",
        name: "Marrakech Textiles",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
        location: "Marrakech",
        rating: 4.7,
        isVerified: false,
        category: "Accessories",
      },
      {
        id: "kente-collective",
        name: "Kente Collective",
        image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
        location: "Accra",
        rating: 4.8,
        isVerified: true,
        category: "Accessories",
      },
      {
        id: "ananse-weaving",
        name: "Ananse Weaving",
        image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
        location: "Kumasi",
        rating: 4.7,
        isVerified: true,
        category: "Accessories",
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
      {/* Hero Section with Carousel */}
      <section className="w-full fade-in -mt-[64px]">
        <Carousel
          items={carouselItems}
          autoplay={true}
          interval={6000}
          aspectRatio="wide"
          className="h-[90vh] max-h-[800px]"
          heroTitleClassName="font-canela text-5xl md:text-7xl mb-4"
        />
      </section>

      {/* What Are You Dressing For Section */}
      <section
        className="py-24 px-6 max-w-7xl mx-auto slide-up"
        id="categories"
      >
        <SectionHeader
          title="What Are You Dressing For?"
          subtitle="Explore designers by occasion - from aisle ready to Lagos bound."
          titleClassName="text-2xl md:text-3xl font-canela"
          subtitleClassName="text-base text-oma-cocoa/80"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              image={category.image}
              href={category.href}
              customCta={category.customCta}
              className="hover-scale shadow-lg animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0"
              style={{ animationDelay: `${index * 150}ms` }}
            />
          ))}
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="py-20 bg-oma-beige relative overflow-hidden slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeader
            title="Spotlight On: Mbali Studio"
            subtitle="Where tradition meets modern edge each piece tells a story you'll want to wear."
            titleClassName="text-2xl md:text-3xl font-canela"
            subtitleClassName="text-base text-oma-cocoa/80"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-10">
            <div className="rounded-2xl overflow-hidden relative group">
              <Image
                src="/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png"
                alt="Mbali Studio collection"
                width={800}
                height={1000}
                className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-oma-black/70 via-oma-black/30 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="font-canela italic text-xl md:text-2xl">
                  &ldquo;This month, meet the Johannesburg studio weaving
                  culture into silk.&rdquo;
                </p>
              </div>
            </div>

            <div className="animate-fade-in flex flex-col h-full justify-center">
              <h3 className="font-canela text-3xl md:text-4xl mb-6 text-oma-plum italic">
                Mbali Studio
              </h3>
              <p className="text-oma-cocoa mb-6 text-lg">
                Founded in 2018 by textile artist Thandi Mbali, this
                Johannesburg based studio has quickly become known for its
                luxurious silk pieces featuring contemporary interpretations of
                traditional African patterns.
              </p>
              <p className="text-oma-cocoa mb-8 text-lg">
                Each piece tells a story of cultural heritage while embracing
                modern silhouettes and sustainable production methods, making it
                a favorite among conscious fashion enthusiasts across the
                continent.
              </p>

              <div className="mt-4 flex flex-col gap-6">
                <div className="p-5 border-l-2 border-oma-gold bg-white/70 rounded-r-lg">
                  <p className="italic text-oma-cocoa/80 text-lg">
                    &ldquo;Where elegance comes stitched with meaning.&rdquo;
                  </p>
                  <p className="text-sm text-oma-cocoa/60 mt-2">
                    — Thandi Mbali, Founder
                  </p>
                </div>

                <Button
                  asChild
                  className="bg-oma-plum hover:bg-oma-plum/90 w-fit mt-4"
                >
                  <Link href="/brand/mbali-studio">See the Collection</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="mt-16">
            <h4 className="font-canela text-xl mb-6 text-oma-cocoa/80">
              Featured Pieces from Mbali Studio
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Link
                  key={i}
                  href="/brand/mbali-studio"
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <Image
                    src={`/lovable-uploads/${
                      [
                        "53ab4ec9-fd54-4aa8-a292-70669af33185.png",
                        "eca14925-7de8-4100-af5d-b158ff70e951.png",
                        "023ba098-0109-4738-9baf-1321bc3d2fe1.png",
                        "840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
                      ][i - 1]
                    }`}
                    alt={`Mbali Studio ${
                      ["Scarf", "Dress", "Top", "Pants"][i - 1]
                    }`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <h5 className="font-medium text-oma-black group-hover:text-oma-plum transition-colors">
                      Silk {["Scarf", "Dress", "Top", "Pants"][i - 1]}
                    </h5>
                    <p className="text-sm text-oma-cocoa/70">
                      {
                        [
                          "Heritage Collection",
                          "Summer '24 Collection",
                          "Essential Series",
                          "Limited Edition",
                        ][i - 1]
                      }
                    </p>
                    <span className="text-sm text-oma-plum mt-2 inline-block">
                      View Collection →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Brand Categories */}
      {categories.map((category, index) => (
        <section
          key={category.title}
          className={`py-16 px-6 ${
            index % 2 === 0 ? "bg-oma-cream" : "bg-oma-beige/30"
          } slide-up`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title={category.title}
              subtitle={category.customCta}
              titleClassName="text-2xl md:text-3xl font-canela"
              subtitleClassName="text-base text-oma-cocoa/80"
            />

            <div className="mt-10 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brand/${brand.id}`}
                    className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/5] relative">
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{brand.name}</h3>
                        {brand.isVerified && (
                          <CheckCircle className="h-5 w-5 text-oma-plum" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                        <span className="px-2 py-1 bg-oma-beige/50 rounded">
                          {category.title}
                        </span>
                        <span>•</span>
                        <span>{brand.location}</span>
                        <span>•</span>
                        <span>★ {brand.rating}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                asChild
                variant="outline"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
              >
                <Link
                  href={`/directory?category=${category.title.toLowerCase()}`}
                >
                  View All {category.title}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-16 px-6 slide-up">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-8 md:p-12 text-center">
            <h2 className="font-canela text-3xl md:text-4xl mb-4">
              Ready to Create Something Beautiful?
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              Join our community of fashion enthusiasts and talented designers
              bringing African creativity to the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <Link href="/directory">Find Your Designer</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
              >
                <Link href="/join">Become a Designer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
