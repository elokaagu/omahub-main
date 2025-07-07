"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionById,
  updateCollection,
} from "@/lib/services/collectionService";
import { Brand, Catalogue } from "@/lib/supabase";
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

export default function EditCataloguePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the catalogue
        const catalogueData = await getCollectionById(id);
        if (!catalogueData) {
          toast.error("Collection not found");
          router.push("/studio/collections");
          return;
        }
        setCatalogue(catalogueData);

        // Initialize form data
        setTitle(catalogueData.title);
        setDescription(catalogueData.description || "");
        setBrandId(catalogueData.brand_id);
        setImage(catalogueData.image);

        // Fetch brands for dropdown
        const brandsData = await getAllBrands();
        setBrands(brandsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load catalogue data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      toast.error("Please enter a catalogue title");
      return;
    }

    if (!brandId) {
      toast.error("Please select a brand");
      return;
    }

    if (!image) {
      toast.error("Please upload an image");
      return;
    }

    setSaving(true);
    try {
      await updateCollection(id, {
        title,
        description: description.trim() || undefined,
        brand_id: brandId,
        image,
      });

      toast.success("Catalogue updated successfully");
      router.push("/studio/catalogues");
    } catch (error) {
      console.error("Error updating catalogue:", error);
      toast.error("Failed to update catalogue");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImage(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/studio/catalogues")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Edit Catalogue</h1>
      </div>

      <div className="space-y-8">
        {/* Catalogue Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue Details</CardTitle>
            <CardDescription>Update your catalogue information</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Catalogue Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter catalogue title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={brandId} onValueChange={setBrandId}>
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of this catalogue..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Main Catalogue Image</Label>
                <p className="text-sm text-gray-600 mb-2">
                  This image will be used as the main catalogue thumbnail
                </p>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  defaultValue={image}
                  bucket="brand-assets"
                  path="catalogues"
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

        {/* Catalogue Images Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue Gallery</CardTitle>
            <CardDescription>
              Manage additional images for this catalogue. These images will be
              displayed in the catalogue gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <CollectionImageManager
              collectionId={id}
              collectionTitle={title || "Collection"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
