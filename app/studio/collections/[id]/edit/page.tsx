"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionById,
  updateCollection,
} from "@/lib/services/collectionService";
import { Brand, Collection } from "@/lib/supabase";
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

export default function EditCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [brandId, setBrandId] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the collection
        const collectionData = await getCollectionById(id);
        if (!collectionData) {
          toast.error("Collection not found");
          router.push("/studio/collections");
          return;
        }
        setCollection(collectionData);

        // Initialize form data
        setTitle(collectionData.title);
        setBrandId(collectionData.brand_id);
        setImage(collectionData.image);

        // Fetch brands for dropdown
        const brandsData = await getAllBrands();
        setBrands(brandsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load collection data");
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
      toast.error("Please enter a collection title");
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
        brand_id: brandId,
        image,
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
    <div>
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/studio/collections")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Edit Collection</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Collection Details</CardTitle>
          <CardDescription>Update your collection information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Collection Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter collection title"
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

            <div className="space-y-2">
              <Label>Collection Image</Label>
              <FileUpload
                onUploadComplete={handleImageUpload}
                defaultValue={image}
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
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
