import { useState, useEffect, KeyboardEvent } from "react";
import { Command } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, MapPin, CheckCircle, Tag, Clock } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { collections, subcategories } from "@/lib/data/directory";

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

// Mock data - in a real app, this would come from your API or database
const searchData = [
  {
    id: "adire-designs",
    name: "Adire Designs",
    category: "Ready to Wear",
    location: "Lagos",
    isVerified: true,
    description: "Contemporary African fashion",
  },
  {
    id: "kente-collective",
    name: "Kente Collective",
    category: "Accessories",
    location: "Accra",
    isVerified: true,
    description: "Traditional Ghanaian textiles",
  },
  {
    id: "zora-atelier",
    name: "Zora Atelier",
    category: "Bridal",
    location: "Nairobi",
    isVerified: true,
    description: "Modern bridal wear",
  },
  {
    id: "mbali-studio",
    name: "Mbali Studio",
    category: "Ready to Wear",
    location: "Johannesburg",
    isVerified: true,
    description: "Luxury ready to wear",
  },
];

const locations = [
  "Lagos",
  "Accra",
  "Nairobi",
  "Johannesburg",
  "Dakar",
  "Abuja",
  "Marrakech",
  "Cairo",
];

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
      <span key={i} className="bg-oma-gold/20">
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
  const router = useRouter();

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    // Search through designers
    const designerResults = searchData
      .filter(
        (designer) =>
          designer.name.toLowerCase().includes(searchLower) ||
          designer.category.toLowerCase().includes(searchLower) ||
          designer.location.toLowerCase().includes(searchLower) ||
          designer.description?.toLowerCase().includes(searchLower)
      )
      .map(
        (designer): SearchResult => ({
          ...designer,
          type: "designer" as const,
          href: `/brand/${designer.id}`,
        })
      );

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

    // Search through locations
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
  }, [searchTerm]);

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
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search designers, categories, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${index}`}
                    className={cn(
                      "w-full text-left px-4 py-2 transition-colors",
                      index === selectedIndex
                        ? "bg-oma-beige"
                        : "hover:bg-oma-beige/50"
                    )}
                    onClick={() => handleSelect(result.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {result.type === "designer" ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {highlightMatch(result.name, searchTerm)}
                            </span>
                            {result.isVerified && (
                              <CheckCircle className="h-4 w-4 text-oma-gold" />
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {highlightMatch(
                              result.location || "",
                              searchTerm
                            )}{" "}
                            •{" "}
                            {highlightMatch(result.category || "", searchTerm)}
                          </div>
                          {result.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {highlightMatch(result.description, searchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getIcon(result.type)}
                        <div>
                          <div className="font-medium">
                            {highlightMatch(result.name, searchTerm)}
                          </div>
                          <div className="text-sm text-muted-foreground">
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
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing to search...
              </div>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
