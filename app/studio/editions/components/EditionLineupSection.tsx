"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  getEditionLineup,
  addEditionLineupBrand,
  deleteEditionLineupBrand,
  type EditionLineupBrand,
} from "@/lib/services/editionLineupService";
import { getBrandCardList } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";
import { BlurIn } from "@/components/studio/BlurIn";
import { BrandCard } from "@/components/ui/brand-card";
import { Loading } from "@/components/ui/loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditionLineupSectionProps = {
  slug: string;
  userId: string | null;
  /** Called after the lineup changes (e.g. to revalidate the public page). */
  onChanged: () => Promise<void>;
};

/** "Lineup brands" editor: loads its own lineup + brand list. */
export function EditionLineupSection({
  slug,
  userId,
  onChanged,
}: EditionLineupSectionProps) {
  const [lineupEntries, setLineupEntries] = useState<
    EditionLineupBrand[] | null
  >(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [selectedLineupBrandId, setSelectedLineupBrandId] = useState("");
  const [isAddingLineupBrand, setIsAddingLineupBrand] = useState(false);
  const [deletingLineupId, setDeletingLineupId] = useState<string | null>(null);

  const refetchLineup = useCallback(async () => {
    const rows = await getEditionLineup(slug);
    setLineupEntries(rows);
  }, [slug]);

  useEffect(() => {
    void refetchLineup();
  }, [refetchLineup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const brands = await getBrandCardList();
        if (!cancelled) setAllBrands(brands);
      } catch (error) {
        console.error("Error loading brands for lineup:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async (brandId?: string) => {
    const targetBrandId = brandId || selectedLineupBrandId;
    if (!userId || !targetBrandId) return;
    try {
      setIsAddingLineupBrand(true);
      await addEditionLineupBrand(userId, {
        edition_slug: slug,
        brand_id: targetBrandId,
      });
      toast.success("Brand added to lineup");
      setSelectedLineupBrandId("");
      await refetchLineup();
      await onChanged();
    } catch (error) {
      console.error("Error adding lineup brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add brand",
      );
    } finally {
      setIsAddingLineupBrand(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!userId) return;
    try {
      setDeletingLineupId(id);
      await deleteEditionLineupBrand(userId, id);
      toast.success("Brand removed from lineup");
      await refetchLineup();
      await onChanged();
    } catch (error) {
      console.error("Error removing lineup brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove brand",
      );
    } finally {
      setDeletingLineupId(null);
    }
  };

  if (lineupEntries === null) {
    return (
      <div className="mb-12 flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  const lineupBrandIds = new Set(lineupEntries.map((entry) => entry.brand_id));
  const lineupBrands = lineupEntries
    .map((entry) => allBrands.find((brand) => brand.id === entry.brand_id))
    .filter((brand): brand is Brand => Boolean(brand));
  const availableLineupBrands = allBrands.filter(
    (brand) => !lineupBrandIds.has(brand.id),
  );

  return (
    <BlurIn className="mb-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Lineup brands
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Brands that showed at this edition — rendered as the scrolling &quot;The
        lineup&quot; row on the edition page, using the same cards as the
        homepage brand rows. The archive card label comes from Lineup label in
        Edition post above, or from this brand count if that field is empty.
      </p>

      {lineupBrands.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lineupEntries.map((entry) => {
            const brand = allBrands.find((b) => b.id === entry.brand_id);
            if (!brand) return null;

            return (
              <div key={entry.id} className="group relative">
                <BrandCard
                  id={brand.id}
                  name={brand.name}
                  image={brand.image || "/placeholder-image.jpg"}
                  category={brand.category}
                  location={brand.location}
                  isVerified={brand.is_verified}
                  rating={brand.rating}
                  video_url={brand.video_url || undefined}
                  video_thumbnail={brand.video_thumbnail || undefined}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Remove ${brand.name} from lineup`}
                      disabled={deletingLineupId === entry.id}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900/70 text-white shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from lineup</AlertDialogTitle>
                      <AlertDialogDescription>
                        {brand.name} will no longer appear in the edition&apos;s
                        brand row. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleRemove(entry.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 max-w-md">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Add brand from directory
          </label>
          <Select
            value={selectedLineupBrandId || "__none"}
            onValueChange={(value) => {
              if (value === "__none") {
                setSelectedLineupBrandId("");
                return;
              }
              setSelectedLineupBrandId(value);
              void handleAdd(value);
            }}
            disabled={isAddingLineupBrand || availableLineupBrands.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isAddingLineupBrand ? "Adding…" : "Select a brand"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Select a brand</SelectItem>
              {availableLineupBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-gray-500">
            Selecting a brand adds it to the lineup and saves immediately.
          </p>
        </div>
      </div>

      {lineupBrands.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          No lineup brands yet. Add brands above to populate the scrolling row
          at the bottom of the edition page.
        </p>
      )}
    </BlurIn>
  );
}
