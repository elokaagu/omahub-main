"use client";
import Link from "next/link";
import Image from "next/image";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";

interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  isVerified: boolean;
  category: string;
}

const carouselItems = [
  {
    id: 1,
    image: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    title: "New Season Collections",
    subtitle:
      "Tailored looks for weddings, travel, and every moment in between.",
    link: "/directory?category=Ready%20to%20Wear",
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
    link: "/directory?category=Ready%20to%20Wear",
    heroTitle: "Made to Measure. Made to Remember.",
  },
];

const categoryDefinitions = [
  {
    title: "Bridal",
    image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    href: "/directory?category=Bridal",
    customCta: 'Tailored for "Yes."',
  },
  {
    title: "Ready to Wear",
    image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    href: "/directory?category=Ready%20to%20Wear",
    customCta: "Looks for the every day that isn't.",
  },
  {
    title: "Tailoring",
    image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    href: "/directory?category=Tailoring",
    customCta: "Custom fits. Clean lines.",
  },
  {
    title: "Accessories",
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    href: "/directory?category=Accessories",
    customCta: "The extras that make it extra.",
  },
];

export default function Home() {
  const [categories, setCategories] = useState<
    Array<{
      title: string;
      image: string;
      href: string;
      customCta: string;
      brands: BrandDisplay[];
    }>
  >(
    categoryDefinitions.map((category) => ({
      ...category,
      brands: [],
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        setLoading(true);
        const allBrands = await getAllBrands();

        if (!allBrands || allBrands.length === 0) {
          console.error("No brands found in database");
          setLoading(false);
          return;
        }

        console.log(`Fetched ${allBrands.length} brands from database`);

        // Create updated categories with brands from database
        const updatedCategories = await Promise.all(
          categoryDefinitions.map(async (category) => {
            // Filter brands by category
            const categoryBrands = allBrands
              .filter((brand) => brand.category === category.title)
              .slice(0, 4) // Get up to 4 brands per category
              .map((brand) => ({
                id: brand.id,
                name: brand.name,
                image: brand.image || "/placeholder-image.jpg",
                location: brand.location.split(",")[0], // Take just the city name
                rating: brand.rating || 4.5,
                isVerified: brand.is_verified,
                category: brand.category,
              }));

            return {
              ...category,
              brands: categoryBrands,
            };
          })
        );

        // Only keep categories that have at least 4 brands
        const filteredCategories = updatedCategories.filter(
          (category) => category.brands.length === 4
        );

        setCategories(filteredCategories);
      } catch (error) {
        console.error("Error fetching brands for home page:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

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
      <section className="py-24 px-6 max-w-7xl mx-auto" id="categories">
        <FadeIn>
          <SectionHeader
            title="What Are You Dressing For?"
            subtitle="Explore designers by occasion - from aisle ready to Lagos bound."
            titleClassName="text-2xl md:text-3xl font-canela"
            subtitleClassName="text-base text-oma-cocoa/80"
          />
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          <StaggerContainer delay={0.1} staggerDelay={0.1}>
            {categoryDefinitions.map((category) => (
              <StaggerItem key={category.title}>
                <CategoryCard
                  key={category.title}
                  title={category.title}
                  image={category.image}
                  href={category.href}
                  customCta={category.customCta}
                  className="hover-scale shadow-lg"
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="py-20 bg-oma-beige relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn>
            <SectionHeader
              title="Spotlight On: Mbali Studio"
              subtitle="Where tradition meets modern edge each piece tells a story you'll want to wear."
              titleClassName="text-2xl md:text-3xl font-canela"
              subtitleClassName="text-base text-oma-cocoa/80"
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-10">
            <SlideUp delay={0.2}>
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
            </SlideUp>

            <SlideUp delay={0.4}>
              <div className="flex flex-col h-full justify-center">
                <h3 className="font-canela text-3xl md:text-4xl mb-6 text-oma-plum italic">
                  Mbali Studio
                </h3>
                <p className="text-oma-cocoa mb-6 text-lg">
                  Founded in 2018 by textile artist Thandi Mbali, this
                  Johannesburg based studio has quickly become known for its
                  luxurious silk pieces featuring contemporary interpretations
                  of traditional African patterns.
                </p>
                <p className="text-oma-cocoa mb-8 text-lg">
                  Each piece tells a story of cultural heritage while embracing
                  modern silhouettes and sustainable production methods, making
                  it a favorite among conscious fashion enthusiasts across the
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
            </SlideUp>
          </div>

          {/* Featured Products */}
          <div className="mt-16">
            <FadeIn delay={0.2}>
              <h4 className="font-canela text-xl mb-6 text-oma-cocoa/80">
                Featured Pieces from Mbali Studio
              </h4>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StaggerContainer delay={0.3} staggerDelay={0.15}>
                {[1, 2, 3, 4].map((i) => (
                  <StaggerItem key={i}>
                    <Link
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
                  </StaggerItem>
                ))}
              </StaggerContainer>
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
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn delay={0.1}>
              <SectionHeader
                title={category.title}
                subtitle={category.customCta}
                titleClassName="text-2xl md:text-3xl font-canela"
                subtitleClassName="text-base text-oma-cocoa/80"
              />
            </FadeIn>

            <div className="mt-10 overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
                </div>
              ) : category.brands.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StaggerContainer delay={0.2} staggerDelay={0.1}>
                    {category.brands.map((brand) => (
                      <StaggerItem key={brand.id}>
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
                              <h3 className="font-semibold text-lg">
                                {brand.name}
                              </h3>
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
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              ) : (
                <FadeIn delay={0.2}>
                  <div className="flex justify-center items-center h-64 bg-oma-beige/30 rounded-lg">
                    <p className="text-oma-cocoa text-lg">
                      No brands found for this category
                    </p>
                  </div>
                </FadeIn>
              )}
            </div>

            <SlideUp delay={0.3}>
              <div className="mt-8 text-center">
                <Button
                  asChild
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
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
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn delay={0.1}>
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
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
