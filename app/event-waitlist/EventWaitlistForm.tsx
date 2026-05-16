"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  buildCatalogPieceLine,
  CatalogFieldPickers,
  CUSTOM_PIECE_VALUE,
  type CatalogProduct,
} from "./CatalogFieldPickers";
import { cmdkSelectHandlers } from "./cmdkSelectHandlers";
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
import { OMAHUB_PLATFORM_BRAND_ID_DEFAULT } from "@/lib/config/platformBrand";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getEmailValidationError } from "@/app/contact/contactValidation";
import {
  FreeTextColourComboField,
  FreeTextSizeComboField,
} from "./FreeTextComboFields";

const OTHER_DESIGNER_VALUE = "__other__";

/**
 * Designer + catalogue flows use Popover + Command comboboxes (searchable
 * dropdowns), not native HTML select elements, so long brand and product lists stay usable.
 */

type DirectoryBrand = { id: string; name: string };

type FormState = {
  name: string;
  email: string;
  phone: string;
  itemDescription: string;
  size: string;
  colour: string;
  additionalNotes: string;
};

const IDS = {
  name: "evt-name",
  email: "evt-email",
  phone: "evt-phone",
  designerSelect: "evt-designer",
  otherDesigner: "evt-other-designer",
  itemDescription: "evt-item",
  size: "evt-size",
  colour: "evt-colour",
  additionalNotes: "evt-notes",
} as const;

function errId(field: string) {
  return `${field}-error`;
}

function isPlatformBrandRow(b: { id: string; name?: string | null }) {
  if (b.id === OMAHUB_PLATFORM_BRAND_ID_DEFAULT) return true;
  const n = (b.name ?? "").trim().toLowerCase();
  return n === "omahub platform";
}

export function EventWaitlistForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    itemDescription: "",
    size: "",
    colour: "",
    additionalNotes: "",
  });
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>("");
  const [otherDesignerName, setOtherDesignerName] = useState("");
  const [brands, setBrands] = useState<DirectoryBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [hpField, setHpField] = useState("");
  const [errors, setErrors] = useState<
    Partial<
      Record<keyof FormState | "designer" | "otherDesigner", string | undefined>
    >
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [designerPopoverOpen, setDesignerPopoverOpen] = useState(false);
  const [brandProducts, setBrandProducts] = useState<CatalogProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFetchError, setProductsFetchError] = useState<string | null>(
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const designerChangeSeq = useRef(0);

  const designerTriggerLabel = useMemo(() => {
    if (!selectedDesignerId) return "Search or select a designer…";
    if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
      return otherDesignerName.trim()
        ? `Other: ${otherDesignerName.trim()}`
        : "Other / not listed";
    }
    return (
      brands.find((b) => b.id === selectedDesignerId)?.name ??
      "Search or select a designer…"
    );
  }, [selectedDesignerId, otherDesignerName, brands]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const res = await fetch("/api/brands/public", {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Could not load designers");
        const json = (await res.json()) as { brands?: unknown[] };
        const raw = Array.isArray(json.brands) ? json.brands : [];
        const mapped: DirectoryBrand[] = raw
          .map((row) => {
            const r = row as { id?: unknown; name?: unknown };
            const id = typeof r.id === "string" ? r.id : "";
            const name = typeof r.name === "string" ? r.name.trim() : "";
            return id && name ? { id, name } : null;
          })
          .filter((b): b is DirectoryBrand => b !== null)
          .filter((b) => !isPlatformBrandRow(b))
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          );
        if (!cancelled) setBrands(mapped);
      } catch {
        if (!cancelled) {
          setBrands([]);
          setBrandsError(
            "Designers could not be loaded. Refresh the page or use Contact.",
          );
        }
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    designerChangeSeq.current += 1;
    const seq = designerChangeSeq.current;
    setSelectedProductId("");
    setBrandProducts([]);
    setProductsFetchError(null);
    setForm((f) => ({
      ...f,
      itemDescription: "",
      size: "",
      colour: "",
    }));

    if (!selectedDesignerId || selectedDesignerId === OTHER_DESIGNER_VALUE) {
      setProductsLoading(false);
      return;
    }

    let cancelled = false;
    setProductsLoading(true);
    const url = `/api/brands/${encodeURIComponent(selectedDesignerId)}/products?limit=500`;
    fetch(url, { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch_failed");
        return res.json() as { products?: unknown[] };
      })
      .then((data) => {
        if (cancelled || seq !== designerChangeSeq.current) return;
        const raw = Array.isArray(data.products) ? data.products : [];
        const mapped: CatalogProduct[] = [];
        for (const row of raw) {
          const o = row as Record<string, unknown>;
          const id = typeof o.id === "string" ? o.id : "";
          if (!id) continue;
          const sizes = Array.isArray(o.sizes)
            ? o.sizes.map((x) => String(x).trim()).filter(Boolean)
            : [];
          const colors = Array.isArray(o.colors)
            ? o.colors.map((x) => String(x).trim()).filter(Boolean)
            : [];
          const imageRaw = o.image;
          const image =
            typeof imageRaw === "string" && imageRaw.trim()
              ? imageRaw.trim()
              : null;
          mapped.push({
            id,
            title: typeof o.title === "string" ? o.title : null,
            category: typeof o.category === "string" ? o.category : null,
            catalogue_title:
              typeof o.catalogue_title === "string" ? o.catalogue_title : null,
            sizes,
            colors,
            image,
          });
        }
        setBrandProducts(mapped);
      })
      .catch(() => {
        if (!cancelled && seq === designerChangeSeq.current) {
          setBrandProducts([]);
          setProductsFetchError("Could not load this designer's catalogue.");
        }
      })
      .finally(() => {
        if (!cancelled && seq === designerChangeSeq.current) {
          setProductsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDesignerId]);

  const showDesignerDropdown =
    !brandsLoading && !brandsError && brands.length > 0;

  const catalogPickupMode =
    showDesignerDropdown &&
    !!selectedDesignerId &&
    selectedDesignerId !== OTHER_DESIGNER_VALUE &&
    !productsLoading &&
    brandProducts.length > 0;

  const catalogLoadingMode =
    showDesignerDropdown &&
    !!selectedDesignerId &&
    selectedDesignerId !== OTHER_DESIGNER_VALUE &&
    productsLoading;

  const resolvedRequestedBrand = useMemo(() => {
    if (!showDesignerDropdown) {
      return otherDesignerName.trim();
    }
    if (!selectedDesignerId) return "";
    if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
      return otherDesignerName.trim();
    }
    return brands.find((b) => b.id === selectedDesignerId)?.name?.trim() ?? "";
  }, [showDesignerDropdown, selectedDesignerId, otherDesignerName, brands]);

  function validate() {
    const next: Partial<
      Record<keyof FormState | "designer" | "otherDesigner", string>
    > = {};
    if (!form.name.trim()) next.name = "Name is required";
    const emailErr = getEmailValidationError(form.email);
    if (emailErr) next.email = emailErr;
    if (showDesignerDropdown) {
      if (!selectedDesignerId) {
        next.designer = "Please choose a designer";
      } else if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
        if (!otherDesignerName.trim()) {
          next.otherDesigner = "Enter the designer or brand name";
        }
      }
    } else if (!brandsLoading) {
      if (!otherDesignerName.trim()) {
        next.designer = "Designer or brand name is required";
      }
    }

    if (catalogPickupMode) {
      if (!selectedProductId) {
        next.itemDescription = "Choose a product from the catalogue";
      } else if (selectedProductId === CUSTOM_PIECE_VALUE) {
        if (!form.itemDescription.trim()) {
          next.itemDescription = "Describe the item or style you want";
        }
        if (!form.size.trim()) {
          next.size = "Enter your size or measurements";
        }
      } else if (!brandProducts.some((x) => x.id === selectedProductId)) {
        next.itemDescription = "Choose a product from the catalogue";
      }
      const p = brandProducts.find((x) => x.id === selectedProductId);
      if (p && selectedProductId !== CUSTOM_PIECE_VALUE) {
        if (p.sizes.length > 0) {
          if (!form.size.trim() || !p.sizes.includes(form.size.trim())) {
            next.size = "Pick a size from the list (or contact us if unsure)";
          }
        } else if (!form.size.trim()) {
          next.size = "Enter your size or measurements";
        }
      }
    } else {
      if (!form.itemDescription.trim()) {
        next.itemDescription = "Describe the item or style you want";
      }
      if (!form.size.trim()) next.size = "Size is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    let requestedBrand = resolvedRequestedBrand;
    if (!requestedBrand) {
      toast.error("Please choose a designer");
      return;
    }
    if (selectedDesignerId === OTHER_DESIGNER_VALUE) {
      requestedBrand = `[Not on OmaHub] ${requestedBrand}`;
    }

    let itemDescription = form.itemDescription.trim();
    if (
      catalogPickupMode &&
      selectedProductId &&
      selectedProductId !== CUSTOM_PIECE_VALUE &&
      !itemDescription
    ) {
      const p = brandProducts.find((x) => x.id === selectedProductId);
      if (p) itemDescription = buildCatalogPieceLine(p);
    }
    if (
      catalogPickupMode &&
      selectedProductId === CUSTOM_PIECE_VALUE &&
      itemDescription
    ) {
      itemDescription = `[Not in catalogue] ${itemDescription}`;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/event-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          requestedBrand,
          itemDescription,
          size: form.size.trim(),
          colour: form.colour.trim() || undefined,
          additionalNotes: form.additionalNotes.trim() || undefined,
          _evt_hp: hpField,
        }),
      });

      if (!res.ok) {
        let msg = "Something went wrong. Please try again.";
        try {
          const j = (await res.json()) as { error?: string };
          if (typeof j.error === "string") msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as { success?: boolean };
      if (data.success) {
        toast.success(
          "You are on the list. Check your inbox for a confirmation email.",
        );
        setForm({
          name: "",
          email: "",
          phone: "",
          itemDescription: "",
          size: "",
          colour: "",
          additionalNotes: "",
        });
        setSelectedDesignerId("");
        setOtherDesignerName("");
        setSelectedProductId("");
        setBrandProducts([]);
        setHpField("");
        setErrors({});
        setDesignerPopoverOpen(false);
        setProductsFetchError(null);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again later.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg bg-oma-beige p-8">
      <p className="mb-6 text-sm text-oma-cocoa/85">
        Custom request, you can reach us at{" "}
        <a
          href="mailto:info@oma-hub.com"
          className="text-oma-plum underline-offset-2 hover:underline"
        >
          info@oma-hub.com
        </a>
        . See also{" "}
        <Link
          href="https://luma.com/user/usr-10IvrGBF3vxclvm"
          className="text-oma-plum underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Events on Luma
        </Link>
        .
      </p>
      <form className="space-y-5" noValidate onSubmit={onSubmit}>
        <input
          type="text"
          name="evt_company"
          value={hpField}
          onChange={(e) => setHpField(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          readOnly
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
        />

        <div className="space-y-2">
          <label
            htmlFor={IDS.name}
            className="block text-sm font-medium text-oma-black"
          >
            Your name
          </label>
          <Input
            id={IDS.name}
            name="name"
            value={form.name}
            onChange={onFieldChange}
            placeholder="Full name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? errId("name") : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.name ? (
            <p id={errId("name")} className="text-sm text-red-500" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor={IDS.email}
            className="block text-sm font-medium text-oma-black"
          >
            Email
          </label>
          <Input
            id={IDS.email}
            name="email"
            type="email"
            value={form.email}
            onChange={onFieldChange}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? errId("email") : undefined}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
          {errors.email ? (
            <p
              id={errId("email")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor={IDS.phone}
            className="block text-sm font-medium text-oma-black"
          >
            Phone (optional)
          </label>
          <Input
            id={IDS.phone}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onFieldChange}
            placeholder="+234 …"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <div className="space-y-2">
          <span
            id={`${IDS.designerSelect}-label`}
            className="block text-sm font-medium text-oma-black"
          >
            Designer / brand you want
          </span>
          {showDesignerDropdown ? (
            <Popover
              open={designerPopoverOpen}
              onOpenChange={setDesignerPopoverOpen}
              modal
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={designerPopoverOpen}
                  aria-labelledby={`${IDS.designerSelect}-label`}
                  id={IDS.designerSelect}
                  aria-invalid={!!errors.designer}
                  aria-describedby={
                    errors.designer ? errId("designer") : undefined
                  }
                  disabled={brandsLoading}
                  className={cn(
                    "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal text-oma-black hover:bg-white focus-visible:ring-oma-plum",
                    !selectedDesignerId && "text-oma-cocoa/70",
                  )}
                >
                  <span className="line-clamp-2 pr-2">
                    {designerTriggerLabel}
                  </span>
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
                  <CommandInput placeholder="Search designers…" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No designer matches.</CommandEmpty>
                    <CommandGroup heading="On OmaHub">
                      {brands.map((b) => (
                        <CommandItem
                          key={b.id}
                          value={b.name}
                          {...cmdkSelectHandlers(() => {
                            setSelectedDesignerId(b.id);
                            setOtherDesignerName("");
                            setDesignerPopoverOpen(false);
                            setErrors((prev) => ({
                              ...prev,
                              designer: undefined,
                              otherDesigner: undefined,
                            }));
                          })}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedDesignerId === b.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                            aria-hidden
                          />
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup>
                      <CommandItem
                        value="other not listed custom designer"
                        {...cmdkSelectHandlers(() => {
                          setSelectedDesignerId(OTHER_DESIGNER_VALUE);
                          setDesignerPopoverOpen(false);
                          setErrors((prev) => ({
                            ...prev,
                            designer: undefined,
                            otherDesigner: undefined,
                          }));
                        })}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedDesignerId === OTHER_DESIGNER_VALUE
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                          aria-hidden
                        />
                        Other / not listed
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : brandsLoading ? (
            <div
              className="flex h-10 w-full items-center rounded-md border border-oma-gold/30 bg-white px-3 text-sm text-oma-cocoa/60"
              aria-busy="true"
            >
              Loading designers…
            </div>
          ) : (
            <>
              <Input
                id={IDS.designerSelect}
                value={otherDesignerName}
                onChange={(e) => {
                  setOtherDesignerName(e.target.value);
                  if (errors.designer) {
                    setErrors((prev) => ({ ...prev, designer: undefined }));
                  }
                }}
                placeholder="Designer or brand name"
                aria-labelledby={`${IDS.designerSelect}-label`}
                aria-invalid={!!errors.designer}
                aria-describedby={
                  errors.designer ? errId("designer") : undefined
                }
                className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
              />
              {brandsError ? (
                <p className="text-sm text-oma-cocoa/80" role="status">
                  {brandsError}{" "}
                  <Link
                    href="/contact"
                    className="text-oma-plum underline-offset-2 hover:underline"
                  >
                    Contact us
                  </Link>
                </p>
              ) : null}
            </>
          )}
          {errors.designer ? (
            <p
              id={errId("designer")}
              className="text-sm text-red-500"
              role="alert"
            >
              {errors.designer}
            </p>
          ) : null}

          {showDesignerDropdown &&
          selectedDesignerId === OTHER_DESIGNER_VALUE ? (
            <div className="space-y-2 pt-1">
              <label
                htmlFor={IDS.otherDesigner}
                className="block text-sm font-medium text-oma-black"
              >
                Designer or brand name
              </label>
              <Input
                id={IDS.otherDesigner}
                name="otherDesigner"
                value={otherDesignerName}
                onChange={(e) => {
                  setOtherDesignerName(e.target.value);
                  if (errors.otherDesigner) {
                    setErrors((prev) => ({
                      ...prev,
                      otherDesigner: undefined,
                    }));
                  }
                }}
                placeholder="As you know them (Instagram, legal name, etc.)"
                aria-invalid={!!errors.otherDesigner}
                aria-describedby={
                  errors.otherDesigner ? errId("otherDesigner") : undefined
                }
                className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
              />
              {errors.otherDesigner ? (
                <p
                  id={errId("otherDesigner")}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.otherDesigner}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {catalogLoadingMode ? (
          <div className="space-y-3 rounded-md border border-oma-gold/25 bg-white/60 px-3 py-4 text-sm text-oma-cocoa/80">
            Loading this designer&apos;s catalogue…
          </div>
        ) : catalogPickupMode ? (
          <CatalogFieldPickers
            products={brandProducts}
            selectedProductId={selectedProductId}
            onSelectProduct={(productId, itemLine) => {
              setSelectedProductId(productId);
              setForm((f) => ({
                ...f,
                itemDescription: itemLine,
                size: "",
                colour: "",
              }));
            }}
            itemDescription={form.itemDescription}
            size={form.size}
            colour={form.colour}
            onItemDescriptionChange={(v) =>
              setForm((f) => ({ ...f, itemDescription: v }))
            }
            onSizeChange={(v) => setForm((f) => ({ ...f, size: v }))}
            onColourChange={(v) => setForm((f) => ({ ...f, colour: v }))}
            errors={{
              itemDescription: errors.itemDescription,
              size: errors.size,
            }}
            onClearError={(key) =>
              setErrors((prev) => ({ ...prev, [key]: undefined }))
            }
          />
        ) : (
          <>
            {productsFetchError &&
            showDesignerDropdown &&
            selectedDesignerId &&
            selectedDesignerId !== OTHER_DESIGNER_VALUE ? (
              <p className="text-sm text-oma-cocoa/85" role="status">
                {productsFetchError} Use the fields below or{" "}
                <Link
                  href="/contact"
                  className="text-oma-plum underline-offset-2 hover:underline"
                >
                  contact us
                </Link>
                .
              </p>
            ) : null}
            {showDesignerDropdown &&
            selectedDesignerId &&
            selectedDesignerId !== OTHER_DESIGNER_VALUE &&
            !productsLoading &&
            brandProducts.length === 0 ? (
              <p className="text-sm text-oma-cocoa/85">
                This designer has no in-stock pieces listed yet. Describe what
                you want below - we&apos;ll still route it to them.
              </p>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor={IDS.itemDescription}
                className="block text-sm font-medium text-oma-black"
              >
                Item or style
              </label>
              <Textarea
                id={IDS.itemDescription}
                name="itemDescription"
                value={form.itemDescription}
                onChange={onFieldChange}
                rows={4}
                placeholder="Product title, look, fabric, or link if you have one"
                aria-invalid={!!errors.itemDescription}
                aria-describedby={
                  errors.itemDescription ? errId("itemDescription") : undefined
                }
                className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
              />
              {errors.itemDescription ? (
                <p
                  id={errId("itemDescription")}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.itemDescription}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <span
                id={`${IDS.size}-label`}
                className="block text-sm font-medium text-oma-black"
              >
                Size
              </span>
              <FreeTextSizeComboField
                id={IDS.size}
                labelId={`${IDS.size}-label`}
                value={form.size}
                onChange={(v) => {
                  setForm((f) => ({ ...f, size: v }));
                  if (errors.size)
                    setErrors((prev) => ({ ...prev, size: undefined }));
                }}
                error={errors.size}
                errId={errId("size")}
              />
              {errors.size ? (
                <p
                  id={errId("size")}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.size}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <span
                id={`${IDS.colour}-label`}
                className="block text-sm font-medium text-oma-black"
              >
                Colour or variant (optional)
              </span>
              <FreeTextColourComboField
                id={IDS.colour}
                labelId={`${IDS.colour}-label`}
                value={form.colour}
                onChange={(v) => setForm((f) => ({ ...f, colour: v }))}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label
            htmlFor={IDS.additionalNotes}
            className="block text-sm font-medium text-oma-black"
          >
            Anything else we should know? (optional)
          </label>
          <Textarea
            id={IDS.additionalNotes}
            name="additionalNotes"
            value={form.additionalNotes}
            onChange={onFieldChange}
            rows={3}
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || brandsLoading || catalogLoadingMode}
          className="w-full bg-oma-plum text-white hover:bg-oma-plum/90"
          title={
            brandsLoading
              ? "Loading designer list…"
              : catalogLoadingMode
                ? "Loading catalogue…"
                : undefined
          }
        >
          {submitting ? "Sending…" : "Join the waitlist"}
        </Button>
      </form>
    </div>
  );
}
