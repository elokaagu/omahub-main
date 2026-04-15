"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllBrands } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";
import InboxStats from "./components/InboxStats";
import InquiryList from "./components/InquiryList";
import InquiryDetail from "./components/InquiryDetail";

interface UserProfile {
  role: string;
  owned_brands: string[];
}

interface InboxClientProps {
  userProfile: UserProfile;
}

interface InboxFilters {
  status?: string;
  priority?: string;
  type?: string;
  brandId?: string;
  search?: string;
}

const SEARCH_DEBOUNCE_MS = 350;

function mergeFilterPatch(
  prev: InboxFilters,
  patch: Partial<InboxFilters>
): InboxFilters {
  const next: InboxFilters = { ...prev };
  (Object.keys(patch) as (keyof InboxFilters)[]).forEach((key) => {
    const v = patch[key];
    if (v === undefined || v === "") {
      delete next[key];
    } else {
      next[key] = v;
    }
  });
  return next;
}

function InboxClientInner({ userProfile }: InboxClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedInquiryId = searchParams.get("inquiry");

  const [filters, setFilters] = useState<InboxFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      setFilters((prev) => mergeFilterPatch(prev, { search: v || undefined }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (userProfile.role !== "super_admin") return;
    let cancelled = false;
    getAllBrands()
      .then((list) => {
        if (!cancelled) setBrands(list);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userProfile.role]);

  const hasAdvancedFilters = Boolean(
    filters.status || filters.priority || filters.type || filters.brandId
  );

  useEffect(() => {
    if (hasAdvancedFilters) setShowFilters(true);
  }, [hasAdvancedFilters]);

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.type,
    filters.brandId,
    filters.search?.trim(),
  ].filter(Boolean).length;

  const setInquiryInUrl = (inquiryId: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (inquiryId) p.set("inquiry", inquiryId);
    else p.delete("inquiry");
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const handleInquirySelect = (inquiryId: string) => {
    setInquiryInUrl(inquiryId);
  };

  const handleBackToList = () => {
    setInquiryInUrl(null);
  };

  const patchFilters = (patch: Partial<InboxFilters>) => {
    setFilters((prev) => mergeFilterPatch(prev, patch));
  };

  const toggleQuickFilter = (
    key: keyof InboxFilters,
    value: string,
    currentMatches: boolean
  ) => {
    setFilters((prev) =>
      currentMatches
        ? mergeFilterPatch(prev, { [key]: undefined })
        : mergeFilterPatch(prev, { [key]: value })
    );
  };

  if (selectedInquiryId) {
    return (
      <InquiryDetail
        inquiryId={selectedInquiryId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-8">
      <InboxStats />

      <Card className="border-oma-beige shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-oma-cocoa pointer-events-none" />
              <Input
                type="search"
                placeholder="Search inquiries…"
                className="pl-10 border-oma-beige focus-visible:ring-oma-plum"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search inquiries"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-oma-beige gap-2"
              onClick={() => setShowFilters((s) => !s)}
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-1 rounded-full px-2 text-xs bg-oma-plum/15 text-oma-plum"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-oma-beige space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-oma-cocoa">Status</Label>
                  <Select
                    value={filters.status ?? "all"}
                    onValueChange={(v) =>
                      patchFilters({ status: v === "all" ? undefined : v })
                    }
                  >
                    <SelectTrigger className="border-oma-beige">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-oma-cocoa">Priority</Label>
                  <Select
                    value={filters.priority ?? "all"}
                    onValueChange={(v) =>
                      patchFilters({ priority: v === "all" ? undefined : v })
                    }
                  >
                    <SelectTrigger className="border-oma-beige">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-oma-cocoa">Type</Label>
                  <Select
                    value={filters.type ?? "all"}
                    onValueChange={(v) =>
                      patchFilters({ type: v === "all" ? undefined : v })
                    }
                  >
                    <SelectTrigger className="border-oma-beige">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="custom_order">Custom order</SelectItem>
                      <SelectItem value="product_question">
                        Product question
                      </SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userProfile.role === "super_admin" && (
                  <div className="space-y-2">
                    <Label className="text-oma-cocoa">Brand</Label>
                    <Select
                      value={filters.brandId ?? "all"}
                      onValueChange={(v) =>
                        patchFilters({ brandId: v === "all" ? undefined : v })
                      }
                    >
                      <SelectTrigger className="border-oma-beige">
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All brands</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-oma-plum"
                  onClick={() => {
                    setFilters({});
                    setSearchInput("");
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className={`gap-2 border-oma-beige ${
            filters.status === "unread"
              ? "bg-oma-plum/10 border-oma-plum text-oma-plum"
              : "bg-white text-oma-cocoa hover:bg-oma-cream"
          }`}
          onClick={() =>
            toggleQuickFilter("status", "unread", filters.status === "unread")
          }
        >
          <InboxIcon className="h-4 w-4" />
          Unread
        </Button>

        <Button
          type="button"
          variant="outline"
          className={`gap-2 border-oma-beige ${
            filters.priority === "urgent"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white text-oma-cocoa hover:bg-oma-cream"
          }`}
          onClick={() =>
            toggleQuickFilter(
              "priority",
              "urgent",
              filters.priority === "urgent"
            )
          }
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          Urgent
        </Button>

        <Button
          type="button"
          variant="outline"
          className={`gap-2 border-oma-beige ${
            filters.status === "replied"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-white text-oma-cocoa hover:bg-oma-cream"
          }`}
          onClick={() =>
            toggleQuickFilter(
              "status",
              "replied",
              filters.status === "replied"
            )
          }
        >
          <CheckCircleIcon className="h-4 w-4" />
          Replied
        </Button>

        <Button
          type="button"
          variant="outline"
          className={`gap-2 border-oma-beige ${
            filters.type === "custom_order"
              ? "bg-oma-cocoa/10 border-oma-cocoa text-oma-cocoa"
              : "bg-white text-oma-cocoa hover:bg-oma-cream"
          }`}
          onClick={() =>
            toggleQuickFilter(
              "type",
              "custom_order",
              filters.type === "custom_order"
            )
          }
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Custom orders
        </Button>
      </div>

      <InquiryList filters={filters} onInquirySelect={handleInquirySelect} />
    </div>
  );
}

function InboxClientFallback() {
  return (
    <div className="space-y-8">
      <div className="h-40 animate-pulse rounded-lg bg-white border border-oma-beige" />
      <div className="h-24 animate-pulse rounded-lg bg-white border border-oma-beige" />
    </div>
  );
}

export default function InboxClient(props: InboxClientProps) {
  return (
    <Suspense fallback={<InboxClientFallback />}>
      <InboxClientInner {...props} />
    </Suspense>
  );
}
