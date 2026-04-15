"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionById,
  updateCollection,
} from "@/lib/services/collectionService";
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
import { CollectionImageManager } from "@/components/studio/CollectionImageManager";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { CollectionEditUnavailable } from "./CollectionEditUnavailable";

type LoadStatus = "loading" | "ready" | "missing" | "error";

type CollectionFormFields = {
  title: string;
  description: string;
  brandId: string;
  image: string;
};

const emptyForm = (): CollectionFormFields => ({
  title: "",
  description: "",
  brandId: "",
  image: "",
});

export default function EditCataloguePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const { user, loading: authLoading } = useAuth();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CollectionFormFields>(emptyForm);

  const loadCollection = useCallback(async () => {
    setLoadStatus("loading");
    setLoadErrorDetail(null);
    try {
      const [catalogueData, brandsData] = await Promise.all([
        getCollectionById(id),
        getAllBrands(),
      ]);

      if (!catalogueData) {
        setBrands([]);
        setForm(emptyForm());
        setLoadStatus("missing");
        return;
      }

      setBrands(brandsData);
      setForm({
        title: catalogueData.title,
        description: catalogueData.description || "",
        brandId: catalogueData.brand_id,
        image: catalogueData.image,
      });
      setLoadStatus("ready");
    } catch (error) {
      console.error("Error fetching collection edit data:", error);
      setLoadErrorDetail(
        error instanceof Error ? error.message : "Unknown error"
      );
      setBrands([]);
      setForm(emptyForm());
      setLoadStatus("error");
    }
  }, [id]);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadCollection();
  }, [authLoading, user, loadCollection]);

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
      await updateCollection(id, {
        title: form.title,
        description: form.description.trim() || undefined,
        brand_id: form.brandId,
        image: form.image,
      });

      toast.success("Collection updated successfully");
      router.push("/studio/collections");
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
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
        <div className="h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
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
          You need to be signed in to edit a collection.
        </p>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/login" className="inline-flex items-center gap-2">
            Go to login
          </Link>
        </Button>
      </div>
    );
  }

  if (loadStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loadStatus === "missing") {
    return <CollectionEditUnavailable variant="missing" />;
  }

  if (loadStatus === "error") {
    return (
      <CollectionEditUnavailable
        variant="error"
        detail={loadErrorDetail}
        onRetry={() => void loadCollection()}
      />
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
        <h1 className="text-3xl font-canela text-gray-900">Edit Collection</h1>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
            <CardDescription>
              Update your collection information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Label>Main Collection Image</Label>
                <p className="text-sm text-gray-600 mb-2">
                  This image will be used as the main collection thumbnail
                </p>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  defaultValue={form.image}
                  bucket="brand-assets"
                  path="collections"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Gallery</CardTitle>
            <CardDescription>
              Manage additional images for this collection. These images will be
              displayed in the collection gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <CollectionImageManager
              collectionId={id}
              collectionTitle={form.title.trim() || "Collection"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
