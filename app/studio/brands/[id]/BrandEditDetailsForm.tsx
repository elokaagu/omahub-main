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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Trash2, CheckCircle, X } from "lucide-react";
import { formatPriceRange } from "@/lib/utils/priceFormatter";
import { formatBrandDescription } from "@/lib/utils/textFormatter";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import { getDisplayPriceRangeForStudio } from "@/lib/brands/getDisplayPriceRangeForStudio";
import type { BrandEditorApi } from "./useBrandEditor";

const categories = getAllCategoryNames();

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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
          <CardDescription>Update information about this brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Brand Name</Label>
              <span
                className={`text-sm ${remainingNameChars < 10 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {remainingNameChars} characters remaining
              </span>
            </div>
            <Input
              id="name"
              name="name"
              value={brand.name}
              onChange={handleChange}
              placeholder="Enter brand name"
              required
              className={remainingNameChars < 0 ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Keep it concise and memorable (max 50 characters)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span
                className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {remainingChars} characters remaining
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              value={brand.description || ""}
              onChange={handleChange}
              rows={3}
              placeholder="A brief description of the brand (max 150 characters)"
              className={remainingChars < 0 ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Keep it concise - this appears in brand listings and previews
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Full Description</Label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Textarea
                  id="long_description"
                  name="long_description"
                  value={brand.long_description || ""}
                  onChange={handleChange}
                  placeholder="Detailed description of the brand, its history, values, etc."
                  className="min-h-[200px]"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  💡 Tip: Contractions (isn&apos;t, it&apos;s, don&apos;t) will be
                  automatically converted to formal language.
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Live Preview
                </Label>
                <div className="min-h-[200px] p-4 bg-gray-50 rounded-md border border-gray-200">
                  {brand.long_description ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formatBrandDescription(brand.long_description)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      Start typing to see the formatted preview...
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  This shows how your description will appear on the frontend
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="price_range">Price Range</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
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
                placeholder="Min price (e.g. 15000)"
                type="number"
              />
              <Input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max price (e.g. 120000)"
                type="number"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {priceMin && priceMax && currency && currency !== "NONE" ? (
                <>
                  Preview:{" "}
                  {formatPriceRange(
                    priceMin,
                    priceMax,
                    STUDIO_CURRENCIES.find((c) => c.code === currency)?.symbol ||
                      "$"
                  )}
                </>
              ) : (
                <>
                  Current: {getDisplayPriceRangeForStudio(brand.price_range)}
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={brand.whatsapp || ""}
                onChange={handleChange}
                placeholder="+234XXXXXXXXXX"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +234 for Nigeria)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={brand.contact_email || ""}
                onChange={handleChange}
                placeholder="hello@brand.com"
              />
              <p className="text-xs text-muted-foreground">
                This email receives customer inquiry notifications. If empty,
                inquiries go to info@oma-hub.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="founded_year">Founded Year</Label>
              <Input
                id="founded_year"
                name="founded_year"
                value={brand.founded_year || ""}
                onChange={handleChange}
                placeholder="e.g. 2020"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Verification Status</Label>
              <Button
                type="button"
                variant={brand.is_verified ? "default" : "outline"}
                size="sm"
                onClick={handleVerifiedToggle}
                className={
                  brand.is_verified ? "bg-green-600 hover:bg-green-700" : ""
                }
              >
                {brand.is_verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" /> Verified
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" /> Not Verified
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Verified brands appear with a checkmark and get higher visibility
              in search results
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Brand"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  brand and all associated data from our servers.
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
            className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
