import { useState, useEffect, KeyboardEvent } from "react";
import { Command } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, MapPin, CheckCircle, Tag, Clock } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { collections, subcategories } from "@/lib/data/directory";
import { getAllBrands, searchBrands } from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";
import { useNavigation } from "@/contexts/NavigationContext";

interface SearchResult {
  id?: string;
  name: string;
  category?: string;
  location?: string;
  isVerified?: boolean;
  type: "designer" | "category" | "location" | "collection" | "occasion";
  href: string;
  description?: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span
        key={i}
        className="bg-oma-gold/30 text-oma-plum font-medium px-1 rounded"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setIsNavigating } = useNavigation();

  // Load all brands and extract unique locations when component mounts
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const allBrands = await getAllBrands();
        setBrands(allBrands);

        // Extract unique locations from brands
        const uniqueLocations = Array.from(
          new Set(allBrands.map((brand) => brand.location).filter(Boolean))
        ).sort();
        setLocations(uniqueLocations);
      } catch (error) {
        console.error("Error loading brands:", error);
      }
    };

    loadBrands();
  }, []);

  // Refresh brands when modal opens (to catch new brands)
  useEffect(() => {
    if (open) {
      const refreshBrands = async () => {
        try {
          const allBrands = await getAllBrands();
          setBrands(allBrands);

          // Update locations as well
          const uniqueLocations = Array.from(
            new Set(allBrands.map((brand) => brand.location).filter(Boolean))
          ).sort();
          setLocations(uniqueLocations);
        } catch (error) {
          console.error("Error refreshing brands:", error);
        }
      };

      refreshBrands();
    }
  }, [open]);

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const searchLower = searchTerm.toLowerCase();

        // Search through brands using database search for better performance
        let designerResults: SearchResult[] = [];
        if (searchTerm.length >= 2) {
          try {
            const searchedBrands = await searchBrands(searchTerm);
            designerResults = searchedBrands.map(
              (brand): SearchResult => ({
                id: brand.id,
                name: brand.name,
                category: brand.category,
                location: brand.location,
                isVerified: brand.is_verified || false,
                type: "designer" as const,
                href: `/brand/${brand.id}`,
                description: brand.description || undefined,
              })
            );
          } catch (error) {
            console.error("Error searching brands:", error);
            // Fallback to local search if database search fails
            designerResults = brands
              .filter(
                (brand) =>
                  brand.name.toLowerCase().includes(searchLower) ||
                  brand.category.toLowerCase().includes(searchLower) ||
                  brand.location.toLowerCase().includes(searchLower) ||
                  brand.description?.toLowerCase().includes(searchLower)
              )
              .map(
                (brand): SearchResult => ({
                  id: brand.id,
                  name: brand.name,
                  category: brand.category,
                  location: brand.location,
                  isVerified: brand.is_verified || false,
                  type: "designer" as const,
                  href: `/brand/${brand.id}`,
                  description: brand.description || undefined,
                })
              );
          }
        } else {
          // For short queries, use local search
          designerResults = brands
            .filter(
              (brand) =>
                brand.name.toLowerCase().includes(searchLower) ||
                brand.category.toLowerCase().includes(searchLower) ||
                brand.location.toLowerCase().includes(searchLower) ||
                brand.description?.toLowerCase().includes(searchLower)
            )
            .map(
              (brand): SearchResult => ({
                id: brand.id,
                name: brand.name,
                category: brand.category,
                location: brand.location,
                isVerified: brand.is_verified || false,
                type: "designer" as const,
                href: `/brand/${brand.id}`,
                description: brand.description || undefined,
              })
            );
        }

        // Search through main categories
        const categoryResults = collections
          .filter((category) => category.toLowerCase().includes(searchLower))
          .map(
            (category): SearchResult => ({
              name: category,
              type: "category" as const,
              href: `/directory?category=${category}`,
              description:
                category === "Collections"
                  ? "Shop for an occasion, holiday, or ready to wear piece"
                  : "Masters of craft creating perfectly fitted garments",
            })
          );

        // Search through subcategories
        const subcategoryResults = Object.entries(subcategories).flatMap(
          ([mainCategory, subcats]) =>
            subcats
              .filter((subcat) => subcat.toLowerCase().includes(searchLower))
              .map(
                (subcat): SearchResult => ({
                  name: subcat,
                  type: "category" as const,
                  href: `/directory?category=${mainCategory}&subcategory=${subcat.replace(/ /g, "+")}`,
                  description: `Browse ${subcat.toLowerCase()} designs`,
                })
              )
        );

        // Search through locations (now dynamic from actual brand data)
        const locationResults = locations
          .filter((location) => location.toLowerCase().includes(searchLower))
          .map(
            (location): SearchResult => ({
              name: location,
              type: "location" as const,
              href: `/directory?location=${location}`,
              description: `Discover designers in ${location}`,
            })
          );

        setResults([
          ...designerResults,
          ...categoryResults,
          ...subcategoryResults,
          ...locationResults,
        ]);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error performing search:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, brands, locations]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelect(results[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    setIsNavigating(true);
    router.push(href);
    onOpenChange(false);
    setSearchTerm("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "designer":
        return null;
      case "category":
        return <Tag className="h-4 w-4 text-oma-plum/70" />;
      case "location":
        return <MapPin className="h-4 w-4 text-oma-plum/70" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 bg-white border-oma-gold/20 shadow-xl">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b border-oma-gold/20 px-4 py-3 bg-oma-cream/30">
            <Search className="mr-3 h-5 w-5 shrink-0 text-oma-plum/60" />
            <input
              placeholder="Search designers, categories, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm text-oma-plum placeholder:text-oma-cocoa/60 border-none outline-none focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto bg-white">
            {loading ? (
              <div className="py-8 text-center text-sm text-oma-cocoa">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-oma-plum border-t-transparent rounded-full"></div>
                  Searching...
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id || index}`}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-all duration-200 border-l-2 border-transparent",
                      index === selectedIndex
                        ? "bg-oma-beige/80 border-l-oma-gold"
                        : "hover:bg-oma-beige/40 hover:border-l-oma-gold/50"
                    )}
                    onClick={() => handleSelect(result.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {result.type === "designer" ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-oma-plum">
                              {highlightMatch(result.name, searchTerm)}
                            </span>
                            {result.isVerified && (
                              <CheckCircle className="h-4 w-4 text-oma-gold" />
                            )}
                          </div>
                          <div className="flex items-center text-sm text-oma-cocoa">
                            <MapPin className="h-3 w-3 mr-1" />
                            {highlightMatch(
                              result.location || "",
                              searchTerm
                            )}{" "}
                            •{" "}
                            {highlightMatch(result.category || "", searchTerm)}
                          </div>
                          {result.description && (
                            <div className="text-sm text-oma-cocoa/80 mt-1 line-clamp-2">
                              {highlightMatch(result.description, searchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {getIcon(result.type)}
                        <div>
                          <div className="font-medium text-oma-plum">
                            {highlightMatch(result.name, searchTerm)}
                          </div>
                          <div className="text-sm text-oma-cocoa/80">
                            {result.description &&
                              highlightMatch(result.description, searchTerm)}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="py-8 text-center text-sm text-oma-cocoa">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-oma-cocoa/40" />
                  <span>No results found for "{searchTerm}"</span>
                  <span className="text-xs text-oma-cocoa/60">
                    Try searching for designers, categories, or locations
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-oma-cocoa">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-oma-cocoa/40" />
                  <span>Start typing to search...</span>
                  <span className="text-xs text-oma-cocoa/60">
                    Find designers, categories, and locations
                  </span>
                </div>
              </div>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
