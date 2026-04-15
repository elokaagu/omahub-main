"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBrands } from "@/lib/services/brandService";
import { createCollection } from "@/lib/services/collectionService";
import { Brand } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

type BrandsLoadStatus = "loading" | "ready" | "error";

type CreateCollectionForm = {
  title: string;
  description: string;
  brandId: string;
  image: string;
};

const emptyForm = (): CreateCollectionForm => ({
  title: "",
  description: "",
  brandId: "",
  image: "",
});

export default function CreateCataloguePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoadStatus, setBrandsLoadStatus] =
    useState<BrandsLoadStatus>("loading");
  const [brandsErrorDetail, setBrandsErrorDetail] = useState<string | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateCollectionForm>(emptyForm());

  const loadBrands = useCallback(async () => {
    setBrandsLoadStatus("loading");
    setBrandsErrorDetail(null);
    try {
      const brandsData = await getAllBrands();
      setBrands(brandsData);
      setForm((prev) => ({
        ...prev,
        brandId: brandsData[0]?.id ?? prev.brandId,
      }));
      setBrandsLoadStatus("ready");
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
      setBrandsErrorDetail(
        error instanceof Error ? error.message : "Failed to load brands"
      );
      setBrandsLoadStatus("error");
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadBrands();
  }, [authLoading, user, loadBrands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a collection title");
      return;
    }

    if (!form.brandId) {
      toast.error("Please select a brand");
      return;
    }

    if (!form.image) {
      toast.error("Please upload an image");
      return;
    }

    setSaving(true);
    try {
      await createCollection({
        title: form.title,
        description: form.description.trim() || undefined,
        brand_id: form.brandId,
        image: form.image,
      });

      toast.success("Collection created successfully");
      router.push("/studio/collections");
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setForm((prev) => ({ ...prev, image: url }));
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
        <h1 className="text-2xl font-canela text-gray-900 mb-2">
          Sign in required
        </h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          You need to be signed in to create a collection.
        </p>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/login" className="inline-flex items-center gap-2">
            Go to login
          </Link>
        </Button>
      </div>
    );
  }

  if (brandsLoadStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (brandsLoadStatus === "error") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
        <h1 className="text-2xl font-canela text-gray-900 mb-2">
          Couldn&apos;t load brands
        </h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          {brandsErrorDetail ??
            "Something went wrong while loading brands. Try again or go back to the list."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" variant="outline" onClick={() => void loadBrands()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio/collections" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to collections
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" className="mr-4" asChild>
          <Link href="/studio/collections" aria-label="Back to collections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">
          Create Collection
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Collection</CardTitle>
          <CardDescription>Create a new collection for a brand</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Collection Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter collection title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter a brief description of this collection..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={form.brandId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, brandId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Collection Image</Label>
              <FileUpload
                onUploadComplete={handleImageUpload}
                defaultValue={form.image}
                bucket="brand-assets"
                path="collections"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
