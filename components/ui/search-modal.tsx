"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Command } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "product" | "designer" | "brand" | "collection" | "page";
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Mock search function - replace with actual search logic
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock results - replace with actual search implementation
    const mockResults: SearchResult[] = [
      {
        id: "1",
        title: "Wedding Dress Collection",
        description: "Beautiful wedding dresses by African designers",
        url: "/collection/wedding-dresses",
        type: "collection",
      },
      {
        id: "2",
        title: "Traditional Attire",
        description: "Authentic African traditional clothing",
        url: "/collection/traditional",
        type: "collection",
      },
      {
        id: "3",
        title: "Custom Tailoring",
        description: "Get your perfect fit with our tailors",
        url: "/tailored",
        type: "page",
      },
    ];

    setResults(
      mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setIsLoading(false);
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
                      <Search className="w-4 h-4 text-oma-plum" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-oma-cocoa group-hover:text-oma-plum transition-colors">
                        {result.title}
                      </h3>
                      <p className="text-sm text-oma-cocoa/60 mt-1">
                        {result.description}
                      </p>
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
