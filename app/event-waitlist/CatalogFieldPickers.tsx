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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Pick this to type a piece that is not in the brand's live catalogue. */
export const CUSTOM_PIECE_VALUE = "__custom_piece__";

export type CatalogProduct = {
  id: string;
  title: string | null;
  category: string | null;
  catalogue_title: string | null;
  sizes: string[];
  colors: string[];
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
    [products, selectedProductId]
  );

  const productGroups = useMemo(() => {
    const m = new Map<string, CatalogProduct[]>();
    for (const p of products) {
      const key =
        p.catalogue_title?.trim() ||
        p.category?.trim() ||
        "All pieces";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return [...m.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [products]);

  const productTriggerLabel =
    selectedProductId === CUSTOM_PIECE_VALUE
      ? "Not listed — I'll describe it"
      : selectedProduct
        ? selectedProduct.title?.trim() || "Selected product"
        : "Search or select a product…";

  const pieceLineForProduct = (p: CatalogProduct) => {
    const t = p.title?.trim() || "Product";
    return `${t} (product ${p.id})`;
  };

  const sizePickable =
    !!selectedProductId &&
    selectedProductId !== CUSTOM_PIECE_VALUE &&
    !!selectedProduct;
  const colourPickable = sizePickable;

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
        <Popover open={productOpen} onOpenChange={setProductOpen}>
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
                "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal text-oma-black hover:bg-white focus-visible:ring-oma-plum",
                !selectedProductId && "text-oma-cocoa/70"
              )}
            >
              <span className="line-clamp-2 pr-2">{productTriggerLabel}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
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
                        onSelect={() => {
                          onSelectProduct(p.id, pieceLineForProduct(p));
                          setProductOpen(false);
                          onClearError("itemDescription");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedProductId === p.id ? "opacity-100" : "opacity-0"
                          )}
                          aria-hidden
                        />
                        <span className="line-clamp-2">
                          {p.title?.trim() || "Untitled piece"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                <CommandGroup>
                  <CommandItem
                    value="not listed describe manually custom"
                    onSelect={() => {
                      onSelectProduct(CUSTOM_PIECE_VALUE, "");
                      setProductOpen(false);
                      onClearError("itemDescription");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedProductId === CUSTOM_PIECE_VALUE
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                      aria-hidden
                    />
                    Not listed — describe manually
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
          <p className="rounded-md border border-oma-gold/20 bg-white/80 px-3 py-2 text-xs text-oma-cocoa/90">
            <span className="font-medium text-oma-black">Selected:</span>{" "}
            {itemDescription}
          </p>
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
        {!sizePickable ? (
          <p className="text-xs text-oma-cocoa/70">
            Choose a product first to see sizes from the listing.
          </p>
        ) : selectedProduct!.sizes.length > 0 ? (
          <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
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
                  !size.trim() && "text-oma-cocoa/70"
                )}
              >
                <span className="line-clamp-2 pr-2">
                  {size.trim() ? size : "Search or select a size…"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
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
                        onSelect={() => {
                          onSizeChange(s);
                          setSizeOpen(false);
                          onClearError("size");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            size === s ? "opacity-100" : "opacity-0"
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
        ) : (
          <Input
            id="evt-size"
            name="size"
            value={size}
            onChange={(e) => {
              onSizeChange(e.target.value);
              if (errors.size) onClearError("size");
            }}
            placeholder="This piece has no preset sizes — enter yours (UK / EU / cm)"
            aria-invalid={!!errors.size}
            aria-describedby={errors.size ? "evt-size-error" : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        )}
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
        {!colourPickable ? (
          <p className="text-xs text-oma-cocoa/70">
            Choose a product first to see colours from the listing.
          </p>
        ) : selectedProduct!.colors.length > 0 ? (
          <Popover open={colourOpen} onOpenChange={setColourOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={colourOpen}
                aria-labelledby="evt-colour-label"
                className={cn(
                  "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal hover:bg-white focus-visible:ring-oma-plum",
                  !colour.trim() && "text-oma-cocoa/70"
                )}
              >
                <span className="line-clamp-2 pr-2">
                  {colour.trim() ? colour : "Search or select a colour…"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
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
                      onSelect={() => {
                        onColourChange("");
                        setColourOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          !colour.trim() ? "opacity-100" : "opacity-0"
                        )}
                        aria-hidden
                      />
                      No preference
                    </CommandItem>
                    {selectedProduct!.colors.map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        onSelect={() => {
                          onColourChange(c);
                          setColourOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            colour === c ? "opacity-100" : "opacity-0"
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
        ) : (
          <Input
            id="evt-colour"
            name="colour"
            value={colour}
            onChange={(e) => onColourChange(e.target.value)}
            placeholder="No preset colours — type if needed"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        )}
      </div>
    </>
  );
}
