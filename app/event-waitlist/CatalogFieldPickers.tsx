"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isImageLikeUrl } from "@/lib/product/mediaUrl";
import {
  FreeTextColourComboField,
  FreeTextSizeComboField,
} from "./FreeTextComboFields";
import { cmdkSelectHandlers } from "./cmdkSelectHandlers";

export function buildCatalogPieceLine(p: CatalogProduct): string {
  const t = p.title?.trim() || "Product";
  return `${t} (product ${p.id})`;
}

function CatalogProductThumb({
  url,
  alt,
  size = "sm",
  className,
}: {
  url: string | null;
  alt: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!isImageLikeUrl(url) || broken || !url) return null;
  const frame =
    size === "sm"
      ? "h-9 w-9 shrink-0"
      : "h-24 w-24 shrink-0 sm:h-28 sm:w-28";
  return (
    <span
      className={cn(
        "relative overflow-hidden rounded-md border border-oma-gold/20 bg-oma-cream",
        frame,
        className,
      )}
    >
      <img
        src={url}
        alt={alt.trim() || "Product"}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

/** Pick this to type a piece that is not in the brand's live catalogue. */
export const CUSTOM_PIECE_VALUE = "__custom_piece__";

export type CatalogProduct = {
  id: string;
  title: string | null;
  category: string | null;
  catalogue_title: string | null;
  sizes: string[];
  colors: string[];
  /** Resolved main still for display (from `images[0]` or `image`). */
  image: string | null;
};

type FieldErrors = Partial<Record<"itemDescription" | "size", string>>;

type Props = {
  products: CatalogProduct[];
  selectedProductId: string;
  onSelectProduct: (productId: string, itemLine: string) => void;
  itemDescription: string;
  size: string;
  colour: string;
  onItemDescriptionChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onColourChange: (value: string) => void;
  errors: FieldErrors;
  onClearError: (key: keyof FieldErrors) => void;
};

/** Product / size / colour: Popover + Command comboboxes (searchable dropdowns) tied to live catalogue data. */
export function CatalogFieldPickers({
  products,
  selectedProductId,
  onSelectProduct,
  itemDescription,
  size,
  colour,
  onItemDescriptionChange,
  onSizeChange,
  onColourChange,
  errors,
  onClearError,
}: Props) {
  const [productOpen, setProductOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colourOpen, setColourOpen] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  const productGroups = useMemo(() => {
    const m = new Map<string, CatalogProduct[]>();
    for (const p of products) {
      const key =
        p.catalogue_title?.trim() || p.category?.trim() || "All pieces";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return [...m.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [products]);

  const productTriggerLabel =
    selectedProductId === CUSTOM_PIECE_VALUE
      ? "Not listed - I'll describe it"
      : selectedProduct
        ? selectedProduct.title?.trim() || "Selected product"
        : "Search or select a product…";

  const hasProductChoice = !!selectedProductId;
  const manualPieceMode = selectedProductId === CUSTOM_PIECE_VALUE;
  const cataloguePieceMode =
    hasProductChoice &&
    selectedProductId !== CUSTOM_PIECE_VALUE &&
    !!selectedProduct;

  return (
    <>
      <div className="space-y-2">
        <span
          id="evt-catalog-product-label"
          className="block text-sm font-medium text-oma-black"
        >
          Item or style
        </span>
        <p className="text-xs text-oma-cocoa/75">
          Pulled from this designer&apos;s live OmaHub catalogue (collections
          and in-stock pieces).
        </p>
        <Popover open={productOpen} onOpenChange={setProductOpen} modal>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={productOpen}
              aria-labelledby="evt-catalog-product-label"
              aria-invalid={!!errors.itemDescription}
              aria-describedby={
                errors.itemDescription ? "evt-itemDescription-error" : undefined
              }
              className={cn(
                "h-auto min-h-10 w-full justify-between gap-2 border-oma-gold/30 bg-white py-2 text-left font-normal text-oma-black hover:bg-white focus-visible:ring-oma-plum",
                !selectedProductId && "text-oma-cocoa/70",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {selectedProductId !== CUSTOM_PIECE_VALUE && selectedProduct ? (
                  <CatalogProductThumb
                    url={selectedProduct.image}
                    alt={selectedProduct.title?.trim() || "Selected product"}
                  />
                ) : null}
                <span className="line-clamp-2 pr-2">{productTriggerLabel}</span>
              </div>
              <ChevronsUpDown
                className="h-4 w-4 shrink-0 opacity-50"
                aria-hidden
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[min(calc(100vw-2rem),28rem)]"
            align="start"
            sideOffset={4}
          >
            <Command shouldFilter>
              <CommandInput placeholder="Search products…" />
              <CommandList className="max-h-72">
                <CommandEmpty>No product matches.</CommandEmpty>
                {productGroups.map(([heading, rows]) => (
                  <CommandGroup key={heading} heading={heading}>
                    {rows.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.title ?? ""} ${p.category ?? ""} ${p.catalogue_title ?? ""} ${p.id}`}
                        {...cmdkSelectHandlers(() => {
                          onSelectProduct(p.id, buildCatalogPieceLine(p));
                          setProductOpen(false);
                          onClearError("itemDescription");
                        })}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedProductId === p.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                          aria-hidden
                        />
                        <CatalogProductThumb
                          url={p.image}
                          alt={p.title?.trim() || "Product"}
                        />
                        <span className="line-clamp-2 min-w-0 flex-1">
                          {p.title?.trim() || "Untitled piece"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                <CommandGroup>
                  <CommandItem
                    value="not listed describe manually custom"
                    {...cmdkSelectHandlers(() => {
                      onSelectProduct(CUSTOM_PIECE_VALUE, "");
                      setProductOpen(false);
                      onClearError("itemDescription");
                    })}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedProductId === CUSTOM_PIECE_VALUE
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      aria-hidden
                    />
                    Not listed - describe manually
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedProductId === CUSTOM_PIECE_VALUE ? (
          <Textarea
            id="evt-itemDescription"
            name="itemDescription"
            value={itemDescription}
            onChange={(e) => {
              onItemDescriptionChange(e.target.value);
              if (errors.itemDescription) onClearError("itemDescription");
            }}
            rows={3}
            placeholder="Describe the piece (style, fabric, link, etc.)"
            aria-invalid={!!errors.itemDescription}
            aria-describedby={
              errors.itemDescription ? "evt-itemDescription-error" : undefined
            }
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        ) : selectedProductId ? (
          <div className="flex gap-3 rounded-md border border-oma-gold/20 bg-white/80 px-3 py-2 text-xs text-oma-cocoa/90">
            {selectedProduct ? (
              <CatalogProductThumb
                url={selectedProduct.image}
                alt={selectedProduct.title?.trim() || "Selected product"}
                size="md"
              />
            ) : null}
            <p className="min-w-0 flex-1 self-center leading-snug">
              <span className="font-medium text-oma-black">Selected:</span>{" "}
              {itemDescription}
            </p>
          </div>
        ) : null}
        {errors.itemDescription ? (
          <p
            id="evt-itemDescription-error"
            className="text-sm text-red-500"
            role="alert"
          >
            {errors.itemDescription}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span
          id="evt-size-label"
          className="block text-sm font-medium text-oma-black"
        >
          Size
        </span>
        {!hasProductChoice ? (
          <p className="text-xs text-oma-cocoa/70">
            Choose a product first to see sizes from the listing.
          </p>
        ) : manualPieceMode ? (
          <FreeTextSizeComboField
            id="evt-size"
            labelId="evt-size-label"
            value={size}
            onChange={(v) => {
              onSizeChange(v);
              onClearError("size");
            }}
            error={errors.size}
            errId="evt-size-error"
          />
        ) : cataloguePieceMode && selectedProduct!.sizes.length > 0 ? (
          <Popover open={sizeOpen} onOpenChange={setSizeOpen} modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={sizeOpen}
                aria-labelledby="evt-size-label"
                aria-invalid={!!errors.size}
                aria-describedby={errors.size ? "evt-size-error" : undefined}
                className={cn(
                  "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal hover:bg-white focus-visible:ring-oma-plum",
                  !size.trim() && "text-oma-cocoa/70",
                )}
              >
                <span className="line-clamp-2 pr-2">
                  {size.trim() ? size : "Search or select a size…"}
                </span>
                <ChevronsUpDown
                  className="h-4 w-4 shrink-0 opacity-50"
                  aria-hidden
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[min(calc(100vw-2rem),22rem)]"
              align="start"
              sideOffset={4}
            >
              <Command shouldFilter>
                <CommandInput placeholder="Search sizes…" />
                <CommandList className="max-h-56">
                  <CommandEmpty>No size matches.</CommandEmpty>
                  <CommandGroup>
                    {selectedProduct!.sizes.map((s) => (
                      <CommandItem
                        key={s}
                        value={s}
                        {...cmdkSelectHandlers(() => {
                          onSizeChange(s);
                          setSizeOpen(false);
                          onClearError("size");
                        })}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            size === s ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden
                        />
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : cataloguePieceMode ? (
          <FreeTextSizeComboField
            id="evt-size"
            labelId="evt-size-label"
            value={size}
            onChange={(v) => {
              onSizeChange(v);
              onClearError("size");
            }}
            error={errors.size}
            errId="evt-size-error"
          />
        ) : null}
        {errors.size ? (
          <p id="evt-size-error" className="text-sm text-red-500" role="alert">
            {errors.size}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span
          id="evt-colour-label"
          className="block text-sm font-medium text-oma-black"
        >
          Colour or variant (optional)
        </span>
        {!hasProductChoice ? (
          <p className="text-xs text-oma-cocoa/70">
            Choose a product first to see colours from the listing.
          </p>
        ) : manualPieceMode ? (
          <FreeTextColourComboField
            id="evt-colour"
            labelId="evt-colour-label"
            value={colour}
            onChange={onColourChange}
          />
        ) : cataloguePieceMode && selectedProduct!.colors.length > 0 ? (
          <Popover open={colourOpen} onOpenChange={setColourOpen} modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={colourOpen}
                aria-labelledby="evt-colour-label"
                className={cn(
                  "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal hover:bg-white focus-visible:ring-oma-plum",
                  !colour.trim() && "text-oma-cocoa/70",
                )}
              >
                <span className="line-clamp-2 pr-2">
                  {colour.trim() ? colour : "Search or select a colour…"}
                </span>
                <ChevronsUpDown
                  className="h-4 w-4 shrink-0 opacity-50"
                  aria-hidden
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[min(calc(100vw-2rem),22rem)]"
              align="start"
              sideOffset={4}
            >
              <Command shouldFilter>
                <CommandInput placeholder="Search colours…" />
                <CommandList className="max-h-48">
                  <CommandEmpty>No colour matches.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="__none__ no colour preference"
                      {...cmdkSelectHandlers(() => {
                        onColourChange("");
                        setColourOpen(false);
                      })}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          !colour.trim() ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden
                      />
                      No preference
                    </CommandItem>
                    {selectedProduct!.colors.map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        {...cmdkSelectHandlers(() => {
                          onColourChange(c);
                          setColourOpen(false);
                        })}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            colour === c ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden
                        />
                        {c}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : cataloguePieceMode ? (
          <FreeTextColourComboField
            id="evt-colour"
            labelId="evt-colour-label"
            value={colour}
            onChange={onColourChange}
          />
        ) : null}
      </div>
    </>
  );
}
