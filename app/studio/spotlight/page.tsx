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
  const { user, session } = useAuth();
  const router = useRouter();
  const [spotlightContent, setSpotlightContent] = useState<SpotlightContent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch spotlight content
  useEffect(() => {
    const fetchSpotlightContent = async () => {
      try {
        setIsLoading(true);
        const content = await getAllSpotlightContent();
        setSpotlightContent(content);
      } catch (error) {
        console.error("Error fetching spotlight content:", error);
        toast.error("Failed to load spotlight content");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchSpotlightContent();
    }
  }, [user]);

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
            Spotlight Management
          </h1>
          <p className="text-oma-cocoa">
            Manage the featured brand spotlight section on the homepage
          </p>
        </div>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link href="/studio/spotlight/create">
            <Plus className="h-4 w-4 mr-2" />
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
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/spotlight/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Spotlight
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotlightContent.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <Image
                  src={item.main_image}
                  alt={item.brand_name}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {item.is_active && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-sm text-oma-cocoa line-clamp-2">
                  {item.subtitle}
                </p>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-oma-black">
                      Brand: {item.brand_name}
                    </p>
                    <p className="text-xs text-oma-cocoa line-clamp-2">
                      {item.brand_description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/studio/spotlight/${item.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>

                    {!item.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(item.id)}
                        disabled={isActivating === item.id}
                        className="flex-1"
                      >
                        {isActivating === item.id ? (
                          <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        Activate
                      </Button>
                    )}

                    {item.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex-1"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
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
                          <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
