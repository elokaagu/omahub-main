"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MediaItem = {
  path: string;
  bucket: string;
  url: string;
  name: string;
  updatedAt: string | null;
};

type Bucket = { id: string; label: string };

type MediaPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen image's public URL. */
  onSelect: (url: string) => void;
  /** Bucket to open on first load, e.g. the one this field uploads to. */
  preferredBucket?: string;
};

/**
 * Browse images already uploaded to OmaHub and reuse one, instead of
 * uploading the same photo twice.
 */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  preferredBucket,
}: MediaPickerProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [bucket, setBucket] = useState(preferredBucket ?? "brand-assets");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const load = useCallback(
    async (targetBucket: string, term: string, signal?: AbortSignal) => {
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/studio/media?bucket=${encodeURIComponent(targetBucket)}&q=${encodeURIComponent(term)}`,
          { credentials: "include", signal },
        );
        if (!response.ok) throw new Error(`Failed (${response.status})`);
        const data = await response.json();
        setItems(data.items ?? []);
        if (data.buckets) setBuckets(data.buckets);
        setStatus("idle");
      } catch (error) {
        if (signal?.aborted) return;
        console.error("Media picker error:", error);
        setStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void load(bucket, search, controller.signal),
      search ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, bucket, search, load]);

  const choose = (item: MediaItem) => {
    onSelect(item.url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Choose an existing image</DialogTitle>
          <DialogDescription>
            Images already uploaded to OmaHub. Pick one to reuse it here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by file name…"
              aria-label="Search images"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {buckets.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setBucket(option.id)}
              aria-pressed={bucket === option.id}
              className={cn(
                "min-h-[36px] rounded-full border px-3 text-xs transition-colors",
                bucket === option.id
                  ? "border-oma-plum bg-oma-plum text-white"
                  : "border-gray-200 text-gray-600 hover:text-gray-900",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {status === "loading" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : status === "error" ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-600">
                Couldn&apos;t load images.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => void load(bucket, search)}
              >
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="mx-auto size-8 text-gray-300" aria-hidden />
              <p className="mt-3 text-sm text-gray-600">
                {search
                  ? "No images match that name."
                  : "No images in this section yet."}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={`${item.bucket}/${item.path}`}>
                  <button
                    type="button"
                    onClick={() => choose(item)}
                    title={item.path}
                    className="group w-full overflow-hidden rounded-lg border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-oma-plum"
                  >
                    <span className="relative block aspect-square bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element -- storage thumbnails */}
                      <img
                        src={item.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="block truncate px-2 py-1.5 text-left text-[11px] text-gray-500">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status === "loading" && (
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Loading images…
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
