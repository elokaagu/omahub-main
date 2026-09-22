import Link from "next/link";
import { SearchX } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generateItemListStructuredData,
  generateWebPageStructuredData,
} from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { getAllBrands, getAverageRatingsByBrandIds } from "@/lib/services/brandService";
import { mapBrandsToDisplay } from "./directoryBrandMap";
import { DirectoryBrandCard } from "./DirectoryBrandCard";
import { DirectoryFilters } from "./DirectoryFilters";
import {
  PAGE_SIZE,
  directoryHref,
  filterDirectoryBrands,
  parseDirectoryQuery,
  sortDirectoryBrands,
  type DirectoryBrand,
} from "./directoryQuery";

export { metadata } from "./metadata";

// Brand edits should show up quickly without rebuilding.
export const revalidate = 120;

/**
 * Brand directory. Brands are loaded, filtered and sorted on the server, so
 * the first screen arrives ready; filters live in the URL.
 */
export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = parseDirectoryQuery(searchParams);

  let brands: DirectoryBrand[] = [];
  let loadFailed = false;
  try {
    const rows = mapBrandsToDisplay(await getAllBrands(false, false));
    const ratings = await getAverageRatingsByBrandIds(
      rows.map((brand) => brand.id),
    ).catch(() => ({}) as Record<string, number>);
    brands = rows.map((brand) => ({ ...brand, rating: ratings[brand.id] }));
  } catch (error) {
    console.error("directory_brands_error", error);
    loadFailed = true;
  }

  const matching = sortDirectoryBrands(
    filterDirectoryBrands(brands, query),
    query.sort,
  );
  const visible = matching.slice(0, query.limit);
  const hasMore = matching.length > visible.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <JsonLd
        data={[
          generateWebPageStructuredData({
            name: "OmaHub Brand Directory",
            description:
              "Curated directory of verified African fashion designers and ateliers from Lagos, Accra, Nairobi, London and the diaspora.",
            url: "/directory",
            speakableText: "true",
          }),
          ...(brands.length > 0
            ? [
                generateItemListStructuredData(
                  "Verified African Fashion Designers on OmaHub",
                  "Taste-led directory of designers verified in person at OmaHub editions.",
                  brands
                    .filter((brand) => brand.isVerified)
                    .slice(0, 50)
                    .map((brand) => ({
                      name: brand.name,
                      url: `/brand/${brand.id}`,
                      image: brand.image || undefined,
                    })),
                ),
              ]
            : []),
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-oma-gold">
            The directory
          </p>
          <h1 className="mt-3 font-canela text-4xl text-oma-black sm:text-5xl">
            Every designer on OmaHub
          </h1>
          <p className="mt-3 text-base leading-relaxed text-oma-cocoa/85">
            Verified ateliers and emerging labels from Lagos to London. Filter
            by category or city, or search for a name you already know.
          </p>
        </header>

        <DirectoryFilters
          query={query}
          resultCount={matching.length}
          totalCount={brands.length}
        />

        {loadFailed ? (
          <p className="py-16 text-center text-oma-cocoa">
            We couldn&apos;t load the directory. Please refresh to try again.
          </p>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <SearchX className="mx-auto size-10 text-oma-cocoa/40" aria-hidden />
            <p className="mt-4 font-canela text-2xl text-oma-black">
              No designers match those filters
            </p>
            <p className="mt-2 text-sm text-oma-cocoa/80">
              Try a different category or city, or clear the filters to see
              everyone.
            </p>
            <Button asChild className="mt-6 bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/directory">Show all designers</Link>
            </Button>
          </div>
        ) : (
          <>
            <div
              className={
                query.view === "grid"
                  ? "mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4"
                  : "mt-8 flex flex-col gap-3"
              }
            >
              {visible.map((brand, index) => (
                <DirectoryBrandCard
                  key={brand.id}
                  brand={brand}
                  view={query.view}
                  priority={index < 4}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  asChild
                  variant="outline"
                  className="min-h-[44px] rounded-full border-oma-plum/30 px-8 text-oma-plum hover:bg-oma-beige/60"
                >
                  <Link
                    href={directoryHref(query, {
                      limit: query.limit + PAGE_SIZE,
                    })}
                    scroll={false}
                  >
                    Show more designers
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-oma-cocoa/70">
                  Showing {visible.length} of {matching.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
