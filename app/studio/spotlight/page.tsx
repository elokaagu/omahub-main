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
  getAllSpotlightContent,
  deleteSpotlightContent,
  setActiveSpotlightContent,
  type SpotlightContent,
} from "@/lib/services/spotlightService";
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export default function SpotlightManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [spotlightContent, setSpotlightContent] = useState<SpotlightContent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [authLoading, user, router]);

  // Fetch spotlight content
  useEffect(() => {
    const fetchSpotlightContent = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const content = await getAllSpotlightContent();
        setSpotlightContent(content);
      } catch (error) {
        console.error("Error fetching spotlight content:", error);
        setLoadError("Could not load spotlight content.");
        toast.error("Failed to load spotlight content");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchSpotlightContent();
    }
  }, [user]);

  const retryFetch = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const content = await getAllSpotlightContent();
      setSpotlightContent(content);
    } catch (error) {
      console.error("Error retrying spotlight content fetch:", error);
      setLoadError("Could not load spotlight content.");
      toast.error("Failed to load spotlight content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      setIsDeleting(id);
      await deleteSpotlightContent(user.id, id);
      setSpotlightContent((prev) => prev.filter((item) => item.id !== id));
      toast.success("Spotlight content deleted successfully");
    } catch (error) {
      console.error("Error deleting spotlight content:", error);
      toast.error("Failed to delete spotlight content");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetActive = async (id: string) => {
    if (!user) return;

    try {
      setIsActivating(id);
      await setActiveSpotlightContent(user.id, id);

      // Update local state
      setSpotlightContent((prev) =>
        prev.map((item) => ({
          ...item,
          is_active: item.id === id,
        }))
      );

      toast.success("Spotlight content activated successfully");
    } catch (error) {
      console.error("Error activating spotlight content:", error);
      toast.error("Failed to activate spotlight content");
    } finally {
      setIsActivating(null);
    }
  };

  if (authLoading || !user) {
    return <Loading />;
  }

  if (user.role !== "super_admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-oma-cocoa">
              Spotlight management is restricted to super admin users.
            </p>
            <Button asChild variant="outline">
              <Link href="/studio">Back to Studio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load spotlight content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-oma-cocoa">{loadError}</p>
            <Button onClick={retryFetch} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Spotlight Management
          </h1>
          <p className="text-oma-cocoa">
            Manage the featured brand spotlight section on the homepage
          </p>
        </div>
        <Button
          asChild
          className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
        >
          <Link
            href="/studio/spotlight/create"
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Spotlight
          </Link>
        </Button>
      </div>

      {spotlightContent.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-oma-cocoa/40 mb-4" />
            <h3 className="text-lg font-medium text-oma-black mb-2">
              No spotlight content yet
            </h3>
            <p className="text-oma-cocoa text-center mb-6">
              Create your first spotlight content to feature a brand on the
              homepage
            </p>
            <Button
              asChild
              className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
            >
              <Link
                href="/studio/spotlight/create"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Spotlight
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {spotlightContent.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative overflow-hidden">
                <Image
                  src={item.main_image || "/placeholder-service.jpg"}
                  alt={item.brand_name}
                  width={400}
                  height={200}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute left-3 top-3">
                  {item.is_active && (
                    <Badge className="border-0 bg-green-500/95 text-white shadow-sm">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader className="space-y-2 px-5 pb-3 pt-4">
                <CardTitle className="line-clamp-1 text-[1.55rem] font-canela leading-tight text-oma-black">
                  {item.title}
                </CardTitle>
                <p className="line-clamp-2 min-h-[2.7rem] text-sm leading-relaxed text-oma-cocoa">
                  {item.subtitle}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 px-5 pb-5 pt-0">
                <div className="rounded-xl border border-oma-beige/70 bg-oma-cream/20 p-3.5">
                  <p className="line-clamp-1 text-sm font-semibold text-oma-black">
                    Brand
                  </p>
                  <p className="line-clamp-1 text-sm text-oma-cocoa">
                    {item.brand_name}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-oma-cocoa/90">
                    {item.brand_description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">
                    {item.video_url ? "Video attached" : "No video"}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Products: {item.featured_products?.length ?? 0}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Updated: {new Date(item.updated_at).toLocaleDateString("en-GB")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href={`/studio/spotlight/${item.id}`}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>

                  {!item.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(item.id)}
                      disabled={isActivating === item.id}
                      className="w-full"
                    >
                      {isActivating === item.id ? (
                        <div className="mr-1.5 h-3.5 w-3.5 rounded-full border border-current border-t-transparent" />
                      ) : (
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Activate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full"
                    >
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                      Active
                    </Button>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={isDeleting === item.id}
                    >
                      {isDeleting === item.id ? (
                        <div className="mr-1.5 h-3.5 w-3.5 rounded-full border border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Spotlight Content
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{item.title}"? This
                        action cannot be undone.
                        {item.is_active
                          ? " This spotlight is currently active and deleting it will remove the active homepage spotlight until another entry is activated."
                          : ""}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
