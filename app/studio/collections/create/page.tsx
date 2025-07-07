"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateCataloguePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        // Fetch brands for dropdown
        const brandsData = await getAllBrands();
        setBrands(brandsData);

        // If there are brands, select the first one by default
        if (brandsData.length > 0) {
          setBrandId(brandsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

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
      await createCollection({
        title,
        description: description.trim() || undefined,
        brand_id: brandId,
        image,
      });

      toast.success("Catalogue created successfully");
      router.push("/studio/catalogues");
    } catch (error) {
      console.error("Error creating catalogue:", error);
      toast.error("Failed to create catalogue");
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
        <h1 className="text-3xl font-canela text-gray-900">Create Catalogue</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Catalogue</CardTitle>
          <CardDescription>Create a new catalogue for a brand</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label>Catalogue Image</Label>
              <FileUpload
                onUploadComplete={handleImageUpload}
                bucket="brand-assets"
                path="catalogues"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Creating..." : "Create Catalogue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
