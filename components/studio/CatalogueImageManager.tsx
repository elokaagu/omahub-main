"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  getCatalogueImages,
  addCatalogueImage,
  updateCatalogueImage,
  deleteCatalogueImage,
  reorderCatalogueImages,
  type CatalogueImage,
} from "@/lib/services/catalogueImageService";
import { FileUpload } from "@/components/ui/file-upload";
import { AuthImage } from "@/components/ui/auth-image";
import { Plus, Trash2, ArrowUp, ArrowDown, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

interface CatalogueImageManagerProps {
  catalogueId: string;
  catalogueTitle: string;
}

export function CatalogueImageManager({
  catalogueId,
  catalogueTitle,
}: CatalogueImageManagerProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<CatalogueImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editAltText, setEditAltText] = useState("");

  useEffect(() => {
    fetchImages();
  }, [catalogueId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const catalogueImages = await getCatalogueImages(catalogueId);
      setImages(catalogueImages);
    } catch (error) {
      console.error("Error fetching catalogue images:", error);
      toast.error("Failed to load catalogue images");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (imageUrl: string) => {
    if (!user) return;

    try {
      setUploading(true);
      const newImage = await addCatalogueImage(
        catalogueId,
        imageUrl,
        `${catalogueTitle} image`
      );

      if (newImage) {
        setImages((prev) => [...prev, newImage]);
        toast.success("Image added successfully");
      }
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error("Failed to add image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!user) return;

    try {
      await deleteCatalogueImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !user) return;

    try {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [
        newImages[index],
        newImages[index - 1],
      ];

      // Update display orders
      const imageOrders = newImages.map((img, idx) => ({
        id: img.id,
        display_order: idx,
      }));

      await reorderCatalogueImages(catalogueId, imageOrders);
      setImages(newImages);
      toast.success("Images reordered successfully");
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Failed to reorder images");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1 || !user) return;

    try {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [
        newImages[index + 1],
        newImages[index],
      ];

      // Update display orders
      const imageOrders = newImages.map((img, idx) => ({
        id: img.id,
        display_order: idx,
      }));

      await reorderCatalogueImages(catalogueId, imageOrders);
      setImages(newImages);
      toast.success("Images reordered successfully");
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Failed to reorder images");
    }
  };

  const handleEditAltText = (imageId: string, currentAltText: string) => {
    setEditingImage(imageId);
    setEditAltText(currentAltText || "");
  };

  const handleSaveAltText = async (imageId: string) => {
    if (!user) return;

    try {
      await updateCatalogueImage(imageId, {
        alt_text: editAltText,
      });

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, alt_text: editAltText } : img
        )
      );

      setEditingImage(null);
      setEditAltText("");
      toast.success("Alt text updated successfully");
    } catch (error) {
      console.error("Error updating alt text:", error);
      toast.error("Failed to update alt text");
    }
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setEditAltText("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Catalogue Images</h3>
          <p className="text-sm text-gray-600">
            Manage images for this catalogue. The first image will be used as
            the main catalogue image.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <FileUpload onUploadComplete={handleImageUpload} />
        </div>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No images yet
            </h4>
            <p className="text-gray-600 text-center mb-6">
              Add images to showcase this catalogue
            </p>
            <FileUpload onUploadComplete={handleImageUpload} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <AuthImage
                  src={image.image_url}
                  alt={image.alt_text || `${catalogueTitle} image ${index + 1}`}
                  aspectRatio="square"
                  className="w-full h-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={85}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {index === 0 && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                      Main Image
                    </Badge>
                  )}
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Alt Text */}
                <div>
                  <Label className="text-xs text-gray-600">Alt Text</Label>
                  {editingImage === image.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Enter alt text..."
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveAltText(image.id)}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-700 line-clamp-1">
                        {image.alt_text || "No alt text"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleEditAltText(image.id, image.alt_text || "")
                        }
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="flex-1"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1}
                      className="flex-1"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Image</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this image? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteImage(image.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
