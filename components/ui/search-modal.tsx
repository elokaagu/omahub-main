"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Command, MapPin, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getAllBrands, searchBrands } from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "brand" | "collection" | "page";
  location?: string;
  category?: string;
  isVerified?: boolean;
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  // Load all brands when component mounts
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brands = await getAllBrands();
        setAllBrands(brands);
      } catch (error) {
        console.error("Error loading brands:", error);
      }
    };
    loadBrands();
  }, []);

  // Handle Cmd+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Real search function using brand data
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Search brands using the searchBrands function
      const searchResults = await searchBrands(searchQuery);

      // Convert brands to search results
      const brandResults: SearchResult[] = searchResults.map((brand) => ({
        id: brand.id,
        title: brand.name,
        description: brand.description || "African fashion brand",
        url: `/brand/${brand.id}`,
        type: "brand",
        location: brand.location,
        category: brand.category,
        isVerified: brand.is_verified,
      }));

      // Add some static results for other content types
      const staticResults: SearchResult[] = [
        {
          id: "tailored",
          title: "Custom Tailoring",
          description: "Get your perfect fit with our tailors",
          url: "/tailored",
          type: "page",
        },
        {
          id: "how-it-works",
          title: "How It Works",
          description: "Learn how OmaHub connects you with African designers",
          url: "/how-it-works",
          type: "page",
        },
      ];

      // Filter static results based on query
      const filteredStaticResults = staticResults.filter(
        (result) =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults([...brandResults, ...filteredStaticResults]);
    } catch (error) {
      console.error("Error performing search:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    // Navigate to result URL
    window.location.href = result.url;
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "brand":
        return <CheckCircle className="w-4 h-4 text-oma-gold" />;
      case "collection":
        return <Search className="w-4 h-4 text-oma-plum" />;
      case "page":
        return <Search className="w-4 h-4 text-oma-plum" />;
      default:
        return <Search className="w-4 h-4 text-oma-plum" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-oma-cocoa/60" />
            <Input
              placeholder="Search for designers, collections, products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none text-lg focus:ring-0 focus:outline-none"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-oma-cocoa/60 hover:text-oma-cocoa"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-oma-cocoa/40 mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
            <span>to search</span>
            <span>•</span>
            <span>Esc to close</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-oma-plum border-t-transparent rounded-full"></div>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-oma-beige/20 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-full flex items-center justify-center mt-1">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-oma-cocoa group-hover:text-oma-plum transition-colors">
                          {result.title}
                        </h3>
                        {result.isVerified && (
                          <CheckCircle className="w-4 h-4 text-oma-gold" />
                        )}
                      </div>
                      <p className="text-sm text-oma-cocoa/60 mt-1">
                        {result.description}
                      </p>
                      {result.location && (
                        <div className="flex items-center gap-1 text-xs text-oma-cocoa/40 mt-2">
                          <MapPin className="w-3 h-3" />
                          <span>{result.location}</span>
                          {result.category && (
                            <>
                              <span>•</span>
                              <span>{result.category}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-oma-cocoa/40 mt-2 capitalize">
                        {result.type}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-8 text-oma-cocoa/60">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}

          {!isLoading && !query && (
            <div className="text-center py-8 text-oma-cocoa/60">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Search for designers, collections, and products</p>
              <p className="text-sm mt-1">Start typing to see results</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
