"use client";

import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductsWithBrandCurrency } from "@/lib/services/productService";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { getProductMainImage } from "@/lib/utils/productImageUtils";
import { cn } from "@/lib/utils";
import type { CatalogueWithBrand, ProductWithBrand } from "./collectionTypes";

const COLLECTION_CARD_IMAGE_CLASS = "object-cover object-center object-top";

function groupCataloguesByCategory(
  items: CatalogueWithBrand[]
): Record<string, CatalogueWithBrand[]> {
  return items.reduce(
    (acc, catalogue) => {
      const category = catalogue.brand.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(catalogue);
      return acc;
    },
    {} as Record<string, CatalogueWithBrand[]>
  );
}

function groupProductsByCategory(
  items: ProductWithBrand[]
): Record<string, ProductWithBrand[]> {
  return items.reduce(
    (acc, product) => {
      const category = product.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, ProductWithBrand[]>
  );
}

function getProductCardPrice(product: ProductWithBrand): string {
  try {
    if (product.service_type === "portfolio") return "";
    return formatProductPrice(product, product.brand).displayPrice;
  } catch {
    if (product.price || product.sale_price) {
      const price = product.sale_price || product.price;
      return `£${price}`;
    }
    return "Price on request";
  }
}

function HorizontalCarousel({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useLayoutEffect(() => {
    updateScrollIndicators();
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 280 : 320;
    const cardsToScroll = isMobile ? 1.5 : 3;
    const scrollAmount = cardWidth * cardsToScroll;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={updateScrollIndicators}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
      >
        {children}
      </div>
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border-oma-cocoa/20 hover:border-oma-plum shadow-lg transition-all duration-200",
          !canScrollLeft && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border-oma-cocoa/20 hover:border-oma-plum shadow-lg transition-all duration-200",
          !canScrollRight && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <div
        className="flex justify-center mt-4 gap-2"
        aria-hidden
        title="Scroll position: left and right edges of the row"
      >
        <div
          className={cn(
            "h-1 rounded-full transition-all duration-200",
            canScrollLeft ? "w-2 bg-oma-cocoa/30" : "w-6 bg-oma-plum"
          )}
        />
        <div
          className={cn(
            "h-1 rounded-full transition-all duration-200",
            canScrollRight ? "w-2 bg-oma-cocoa/30" : "w-6 bg-oma-plum"
          )}
        />
      </div>
    </div>
  );
}

function ProductCarouselSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: ProductWithBrand[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="w-full overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-canela text-oma-black mb-2">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-oma-cocoa/80 max-w-2xl">
          {subtitle}
        </p>
      </div>
      <HorizontalCarousel>
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-none w-[280px] md:w-[300px] lg:w-[320px] snap-start"
          >
            <Link
              href={`/product/${product.id}`}
              className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full"
            >
              <div className="aspect-square relative">
                <LazyImage
                  src={getProductMainImage(product) || "/placeholder.png"}
                  alt={product.title}
                  fill
                  className="object-cover"
                  aspectRatio="square"
                  quality={80}
                  sizes="(max-width: 768px) 280px, (max-width: 1200px) 300px, 320px"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2 text-black">
                  {product.title}
                </h3>
                <p className="text-oma-cocoa/70 text-sm mb-3">
                  {product.brand?.name || "Unknown Brand"}
                </p>
                <p className="text-oma-plum font-medium text-sm sm:text-base">
                  {getProductCardPrice(product)}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

function CollectionCarouselSection({
  title,
  subtitle,
  catalogues,
}: {
  title: string;
  subtitle: string;
  catalogues: CatalogueWithBrand[];
}) {
  if (catalogues.length === 0) return null;

  return (
    <section className="w-full overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-canela text-oma-black mb-2">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-oma-cocoa/80 max-w-2xl">
          {subtitle}
        </p>
      </div>
      <HorizontalCarousel>
        {catalogues.map((catalogue) => (
          <div
            key={catalogue.id}
            className="flex-none w-[280px] md:w-[300px] lg:w-[320px] snap-start"
          >
            <Link
              href={`/collection/${catalogue.id}`}
              className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full group"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <LazyImage
                  src={catalogue.image || "/placeholder-image.jpg"}
                  alt={catalogue.title}
                  fill
                  className={`${COLLECTION_CARD_IMAGE_CLASS} group-hover:scale-105 transition-transform duration-300`}
                  sizes="(max-width: 768px) 280px, (max-width: 1200px) 300px, 320px"
                  aspectRatio="4/5"
                  quality={80}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <h3 className="font-medium text-lg mb-1 text-white">
                    {catalogue.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-2">
                    {catalogue.brand.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">
                      {catalogue.brand.location}
                    </span>
                    {catalogue.brand.is_verified ? (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 text-xs"
                      >
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

interface CollectionsPageClientProps {
  initialCollections: CatalogueWithBrand[];
  initialLoadError: string | null;
}

export default function CollectionsPageClient({
  initialCollections,
  initialLoadError,
}: CollectionsPageClientProps) {
  const [catalogues, setCatalogues] = useState<CatalogueWithBrand[]>(
    initialCollections
  );
  const [filteredCatalogues, setFilteredCatalogues] = useState<
    CatalogueWithBrand[]
  >(initialCollections);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithBrand[]>(
    []
  );
  const [productSearch, setProductSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedProductCategory, setSelectedProductCategory] = useState("all");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setCatalogues(initialCollections);
    setFilteredCatalogues(initialCollections);
  }, [initialCollections]);

  useEffect(() => {
    if (!showAllProducts || productsFetched) return;

    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const productData = await getProductsWithBrandCurrency();
        if (cancelled) return;
        setProducts(productData || []);
        setFilteredProducts(productData || []);
        setProductsFetched(true);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (!cancelled) {
          setProductsError("Failed to load products");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [showAllProducts, productsFetched]);

  useEffect(() => {
    let filtered = catalogues;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (catalogue) =>
          catalogue.title.toLowerCase().includes(q) ||
          catalogue.brand.name.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (catalogue) => catalogue.brand.category === selectedCategory
      );
    }
    setFilteredCatalogues(filtered);
  }, [catalogues, searchTerm, selectedCategory]);

  useEffect(() => {
    let filtered = products;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(q) ||
          product.brand.name.toLowerCase().includes(q)
      );
    }
    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (product) => product.brand.name === selectedBrand
      );
    }
    if (selectedProductCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedProductCategory
      );
    }
    setFilteredProducts(filtered);
  }, [products, productSearch, selectedBrand, selectedProductCategory]);

  const categories = [
    "all",
    ...Array.from(new Set(catalogues.map((c) => c.brand.category))),
  ];
  const brands = [
    "all",
    ...Array.from(new Set(products.map((p) => p.brand.name))),
  ];
  const productCategories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const cataloguesByCategory = groupCataloguesByCategory(filteredCatalogues);
  const productsByCategory = groupProductsByCategory(filteredProducts);

  if (initialLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-canela text-oma-cocoa mb-4">
              Something went wrong
            </h1>
            <p className="text-oma-cocoa/70 mb-8">{initialLoadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-oma-plum text-white px-6 py-3 rounded-lg hover:bg-oma-plum/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-canela text-black mb-4 sm:mb-6 text-left">
            {showAllProducts ? "All Products" : "Our Collections"}
          </h1>
          <p className="text-lg sm:text-xl text-oma-cocoa/80 max-w-3xl text-left">
            {showAllProducts
              ? "Browse our complete collection of products"
              : "Explore curated collections from Africa's most talented designers"}
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="w-full">
            <Input
              type="text"
              placeholder={
                showAllProducts ? "Search products..." : "Search collections..."
              }
              value={showAllProducts ? productSearch : searchTerm}
              onChange={(e) =>
                showAllProducts
                  ? setProductSearch(e.target.value)
                  : setSearchTerm(e.target.value)
              }
              className="w-full h-12 text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 h-12 px-6 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              type="button"
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="flex-1 sm:flex-none h-12 px-6 bg-oma-plum text-white hover:bg-oma-plum/90 font-medium"
            >
              {showAllProducts ? "View Collections" : "View All Products"}
            </Button>
          </div>

          {showFilters ? (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {showAllProducts ? (
                  <>
                    <Select
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand === "all" ? "All Brands" : brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedProductCategory}
                      onValueChange={setSelectedProductCategory}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === "all" ? "All Categories" : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {showAllProducts ? (
          productsLoading && products.length === 0 ? (
            <Loading />
          ) : productsError ? (
            <div className="text-center py-16">
              <p className="text-oma-cocoa/80 mb-4">{productsError}</p>
              <Button
                type="button"
                onClick={() => {
                  setProductsFetched(false);
                  setProductsError(null);
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByCategory).map(
                ([category, categoryProducts]) => (
                  <ProductCarouselSection
                    key={category}
                    title={category === "Other" ? "Other Products" : category}
                    subtitle={`Discover our ${category.toLowerCase()} collection`}
                    products={categoryProducts}
                  />
                )
              )}
            </div>
          )
        ) : (
          <div className="space-y-12">
            {Object.entries(cataloguesByCategory).map(
              ([category, categoryCatalogues]) => (
                <CollectionCarouselSection
                  key={category}
                  title={category === "Other" ? "Other Collections" : category}
                  subtitle={`Explore ${category.toLowerCase()} designs`}
                  catalogues={categoryCatalogues}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
