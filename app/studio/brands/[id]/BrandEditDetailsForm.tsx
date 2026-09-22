import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Trash2, CheckCircle, X } from "lucide-react";
import { formatPriceRange } from "@/lib/utils/priceFormatter";
import { formatBrandDescription } from "@/lib/utils/textFormatter";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import { getDisplayPriceRangeForStudio } from "@/lib/brands/getDisplayPriceRangeForStudio";
import { cn } from "@/lib/utils";
import type { BrandEditorApi } from "./useBrandEditor";

const categories = getAllCategoryNames();

function CharacterCount({ remaining, warnAt }: { remaining: number; warnAt: number }) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        remaining < 0
          ? "text-red-600"
          : remaining < warnAt
            ? "text-amber-600"
            : "text-gray-500",
      )}
    >
      {remaining} left
    </span>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}

/**
 * Brand editing form, grouped into identity, listing and contact so a long
 * page is scannable, with the save/delete bar pinned to the bottom.
 */
export function BrandEditDetailsForm({ editor }: { editor: BrandEditorApi }) {
  const {
    brand,
    saving,
    deleting,
    handleSubmit,
    handleDelete,
    handleChange,
    handleCategoriesChange,
    handleVerifiedToggle,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    currency,
    setCurrency,
    displayedCategories,
    STUDIO_CURRENCIES,
    SHORT_DESCRIPTION_LIMIT,
    BRAND_NAME_LIMIT,
  } = editor;

  if (!brand) return null;

  const remainingChars =
    SHORT_DESCRIPTION_LIMIT - (brand.description || "").length;
  const remainingNameChars = BRAND_NAME_LIMIT - (brand.name || "").length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="font-canela text-gray-900">
            Brand identity
          </CardTitle>
          <CardDescription className="text-gray-600">
            The name and words that introduce this designer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Brand name</Label>
              <CharacterCount remaining={remainingNameChars} warnAt={10} />
            </div>
            <Input
              id="name"
              name="name"
              value={brand.name}
              onChange={handleChange}
              placeholder="Enter brand name"
              required
              className={cn("max-w-xl", remainingNameChars < 0 && "border-red-500")}
            />
            <FieldHint>Concise and memorable, up to 50 characters.</FieldHint>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Short description</Label>
              <CharacterCount remaining={remainingChars} warnAt={20} />
            </div>
            <Textarea
              id="description"
              name="description"
              value={brand.description || ""}
              onChange={handleChange}
              rows={2}
              placeholder="One line that sums up the brand"
              className={cn("max-w-2xl", remainingChars < 0 && "border-red-500")}
            />
            <FieldHint>
              Shown on directory cards and previews, so keep it tight.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Full description</Label>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Textarea
                  id="long_description"
                  name="long_description"
                  value={brand.long_description || ""}
                  onChange={handleChange}
                  placeholder="The brand's story, craft and values"
                  className="min-h-[220px]"
                />
                <FieldHint>
                  Contractions (isn&apos;t, it&apos;s) are converted to formal
                  language automatically.
                </FieldHint>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  How it reads on the site
                </span>
                <div className="min-h-[220px] whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  {brand.long_description ? (
                    formatBrandDescription(brand.long_description)
                  ) : (
                    <span className="italic text-gray-400">
                      Start typing to see the formatted version…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="font-canela text-gray-900">
            Directory listing
          </CardTitle>
          <CardDescription className="text-gray-600">
            How this brand is filed and filtered in the directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <MultiSelect
                options={categories}
                value={displayedCategories}
                onValueChange={handleCategoriesChange}
                placeholder="Select categories"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={brand.location}
                onChange={handleChange}
                placeholder="e.g. Lagos, Nigeria"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_range">Price range</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="price_range">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min (e.g. 15000)"
                type="number"
                aria-label="Minimum price"
              />
              <Input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max (e.g. 120000)"
                type="number"
                aria-label="Maximum price"
              />
            </div>
            <FieldHint>
              {priceMin && priceMax && currency && currency !== "NONE" ? (
                <>
                  Shows as{" "}
                  {formatPriceRange(
                    priceMin,
                    priceMax,
                    STUDIO_CURRENCIES.find((c) => c.code === currency)?.symbol ||
                      "$",
                  )}
                </>
              ) : (
                <>Currently {getDisplayPriceRangeForStudio(brand.price_range)}</>
              )}
            </FieldHint>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <Label className="text-gray-900">Verification</Label>
              <p className="mt-0.5 text-xs text-gray-500">
                Verified brands show a checkmark and rank higher in search.
              </p>
            </div>
            <Button
              type="button"
              variant={brand.is_verified ? "default" : "outline"}
              size="sm"
              onClick={handleVerifiedToggle}
              className={brand.is_verified ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {brand.is_verified ? (
                <>
                  <CheckCircle className="mr-1 h-4 w-4" /> Verified
                </>
              ) : (
                <>
                  <X className="mr-1 h-4 w-4" /> Not verified
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="font-canela text-gray-900">
            Contact and links
          </CardTitle>
          <CardDescription className="text-gray-600">
            How customers reach this designer from their public page
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact email</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={brand.contact_email || ""}
              onChange={handleChange}
              placeholder="hello@brand.com"
            />
            <FieldHint>
              Receives customer enquiries. Left empty, they go to
              info@oma-hub.com.
            </FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={brand.whatsapp || ""}
              onChange={handleChange}
              placeholder="+234XXXXXXXXXX"
              type="tel"
            />
            <FieldHint>Include the country code, e.g. +234 for Nigeria.</FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              name="instagram"
              value={brand.instagram || ""}
              onChange={handleChange}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={brand.website || ""}
              onChange={handleChange}
              placeholder="https://example.com"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="founded_year">Founded year</Label>
            <Input
              id="founded_year"
              name="founded_year"
              value={brand.founded_year || ""}
              onChange={handleChange}
              placeholder="e.g. 2020"
              type="number"
              className="max-w-[12rem]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pinned so Save stays reachable in a long form. */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting…" : "Delete brand"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {brand.name} and everything attached to
                it. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          type="submit"
          className="flex items-center gap-2 bg-oma-plum hover:bg-oma-plum/90"
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
