"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getAllHeroSlides,
  deleteHeroSlide,
  toggleHeroSlideStatus,
  reorderHeroSlides,
  type HeroSlide,
} from "@/lib/services/heroService";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export default function HeroManagementPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch hero slides
  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        setIsLoading(true);
        const slides = await getAllHeroSlides();
        setHeroSlides(slides);
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        toast.error("Failed to load hero slides");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchHeroSlides();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      setIsDeleting(id);
      await deleteHeroSlide(user.id, id);
      setHeroSlides((prev) => prev.filter((slide) => slide.id !== id));
      toast.success("Hero slide deleted successfully");
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      toast.error("Failed to delete hero slide");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      setIsToggling(id);
      await toggleHeroSlideStatus(user.id, id, !currentStatus);

      // Update local state
      setHeroSlides((prev) =>
        prev.map((slide) =>
          slide.id === id ? { ...slide, is_active: !currentStatus } : slide
        )
      );

      toast.success(
        `Hero slide ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling hero slide status:", error);
      toast.error("Failed to update hero slide status");
    } finally {
      setIsToggling(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !user) return;

    try {
      setIsReordering(true);
      const newSlides = [...heroSlides];
      [newSlides[index - 1], newSlides[index]] = [
        newSlides[index],
        newSlides[index - 1],
      ];

      const slideIds = newSlides.map((slide) => slide.id);
      await reorderHeroSlides(user.id, slideIds);

      setHeroSlides(newSlides);
      toast.success("Hero slides reordered successfully");
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      toast.error("Failed to reorder hero slides");
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === heroSlides.length - 1 || !user) return;

    try {
      setIsReordering(true);
      const newSlides = [...heroSlides];
      [newSlides[index], newSlides[index + 1]] = [
        newSlides[index + 1],
        newSlides[index],
      ];

      const slideIds = newSlides.map((slide) => slide.id);
      await reorderHeroSlides(user.id, slideIds);

      setHeroSlides(newSlides);
      toast.success("Hero slides reordered successfully");
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      toast.error("Failed to reorder hero slides");
    } finally {
      setIsReordering(false);
    }
  };

  if (user?.role !== "super_admin") {
    return <Loading />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Hero Carousel Management
          </h1>
          <p className="text-oma-cocoa">
            Manage the hero slides that appear on the homepage carousel
          </p>
        </div>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/studio/hero/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Hero Slide
          </Link>
        </Button>
      </div>

      {heroSlides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-oma-cocoa/40 mb-4" />
            <h3 className="text-lg font-medium text-oma-black mb-2">
              No hero slides yet
            </h3>
            <p className="text-oma-cocoa text-center mb-6">
              Create your first hero slide to feature on the homepage carousel
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/hero/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Hero Slide
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {heroSlides.map((slide, index) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="flex">
                {/* Image Preview */}
                <div className="relative w-48 h-32 flex-shrink-0">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {slide.is_active && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                        Active
                      </Badge>
                    )}
                    {slide.is_editorial && (
                      <Badge variant="secondary" className="text-xs">
                        Editorial
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-oma-black mb-1">
                        {slide.hero_title || slide.title}
                      </h3>
                      <p className="text-sm text-oma-cocoa mb-2">
                        {slide.subtitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-oma-cocoa/70">
                        <span>Order: {slide.display_order}</span>
                        <span>•</span>
                        <span>Link: {slide.link || "No link"}</span>
                      </div>
                    </div>

                    {/* Order Controls */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isReordering}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={
                          index === heroSlides.length - 1 || isReordering
                        }
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/studio/hero/${slide.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(slide.id, slide.is_active)
                      }
                      disabled={isToggling === slide.id}
                    >
                      {isToggling === slide.id ? (
                        <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : slide.is_active ? (
                        <EyeOff className="h-3 w-3 mr-1" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      {slide.is_active ? "Deactivate" : "Activate"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === slide.id}
                        >
                          {isDeleting === slide.id ? (
                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Hero Slide</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{slide.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(slide.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
