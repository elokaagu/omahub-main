"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  getCollectionImages,
  addCollectionImage,
  updateCollectionImage,
  deleteCollectionImage,
  reorderCollectionImages,
  type CollectionImage,
} from "@/lib/services/collectionImageService";

interface CollectionImageManagerProps {
  collectionId: string;
  collectionTitle: string;
}

export function CollectionImageManager({
  collectionId,
  collectionTitle,
}: CollectionImageManagerProps) {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<CollectionImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");

  // Load images
  useEffect(() => {
    loadImages();
  }, [collectionId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const collectionImages = await getCollectionImages(collectionId);
      setImages(collectionImages);
    } catch (error) {
      console.error("Error fetching collection images:", error);
      toast.error("Failed to load collection images");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    try {
      setLoading(true);
      const newImage = await addCollectionImage(
        collectionId,
        newImageUrl.trim(),
        newImageAlt.trim() || `${collectionTitle} image`
      );

      if (newImage) {
        setImages([...images, newImage]);
        setNewImageUrl("");
        setNewImageAlt("");
        toast.success("Image added successfully");
      }
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error("Failed to add image");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteCollectionImage(imageId);
      setImages(images.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [
      newImages[index],
      newImages[index - 1],
    ];

    setImages(newImages);

    try {
      const imageOrders = newImages.map((item, idx) => ({
        id: item.id,
        display_order: idx + 1,
      }));

      await reorderCollectionImages(collectionId, imageOrders);
      toast.success("Images reordered successfully");
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Failed to reorder images");
      loadImages();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];

    setImages(newImages);

    try {
      const imageOrders = newImages.map((item, idx) => ({
        id: item.id,
        display_order: idx + 1,
      }));

      await reorderCollectionImages(collectionId, imageOrders);
      toast.success("Images reordered successfully");
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Failed to reorder images");
      loadImages();
    }
  };

  const handleUpdateAltText = async (imageId: string, altText: string) => {
    try {
      const currentImage = images.find((img) => img.id === imageId);
      if (!currentImage) return;

      await updateCollectionImage(imageId, {
        alt_text: altText,
        image_url: currentImage.image_url,
        display_order: currentImage.display_order,
      });

      setImages(
        images.map((img) =>
          img.id === imageId ? { ...img, alt_text: altText } : img
        )
      );
      toast.success("Alt text updated successfully");
    } catch (error) {
      console.error("Error updating alt text:", error);
      toast.error("Failed to update alt text");
    }
  };

  if (loading && images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Images</CardTitle>
        <p className="text-sm text-gray-600">
          Manage images for this collection. The first image will be used as the
          main collection image.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new image form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Add New Image</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="imageAlt">Alt Text (Optional)</Label>
              <Input
                id="imageAlt"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Add images to showcase this collection"
              />
            </div>
            <Button
              onClick={handleAddImage}
              disabled={!newImageUrl.trim() || loading}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>
        </div>

        {/* Images list */}
        {images.length > 0 ? (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={image.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center space-x-4">
                  <img
                    src={image.image_url}
                    alt={
                      image.alt_text || `${collectionTitle} image ${index + 1}`
                    }
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <Input
                      value={image.alt_text || ""}
                      onChange={(e) =>
                        handleUpdateAltText(image.id, e.target.value)
                      }
                      placeholder="Alt text"
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      Order: {index + 1}
                      {index === 0 && " (Main image)"}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No images added yet</p>
            <p className="text-sm">Add some images to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
