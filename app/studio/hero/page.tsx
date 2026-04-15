"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Monitor,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import { SuperAdminHeroGate } from "./SuperAdminHeroGate";
import { useHeroSlidesAdmin } from "./useHeroSlidesAdmin";

export default function HeroManagementPage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage the homepage hero carousel">
      <HeroManagementContent />
    </SuperAdminHeroGate>
  );
}

function HeroManagementContent() {
  const { user } = useAuth();
  const {
    heroSlides,
    listLoad,
    fetchSlides,
    isDeleting,
    isToggling,
    reorderInFlight,
    reorderUpLoading,
    reorderDownLoading,
    handleDelete,
    handleToggleStatus,
    handleMoveUp,
    handleMoveDown,
  } = useHeroSlidesAdmin(user);

  if (listLoad.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (listLoad.status === "error") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-oma-black mb-2">
          Couldn&apos;t load hero slides
        </h1>
        <p className="text-oma-cocoa mb-6">{listLoad.message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            className="bg-oma-plum hover:bg-oma-plum/90"
            onClick={() => void fetchSlides()}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <NavigationLink href="/studio">Back to Studio</NavigationLink>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Hero Carousel Management
          </h1>
          <p className="text-oma-cocoa">
            Manage the hero slides displayed on the homepage
          </p>
        </div>
        <Button
          asChild
          className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
        >
          <NavigationLink
            href="/studio/hero/create"
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Hero Slide
          </NavigationLink>
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
              Create your first hero slide to showcase content on the homepage
            </p>
            <Button
              asChild
              className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
            >
              <NavigationLink
                href="/studio/hero/create"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Hero Slide
              </NavigationLink>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {heroSlides.map((slide, index) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/3">
                  <div className="aspect-video lg:aspect-square relative">
                    <AuthImage
                      src={slide.image}
                      alt={slide.title}
                      aspectRatio="video"
                      className="w-full h-full lg:aspect-square"
                      sizes="(max-width: 1024px) 100vw, 400px"
                      quality={80}
                    />
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-oma-black">
                          {slide.title}
                        </h3>
                        <Badge
                          variant={slide.is_active ? "default" : "secondary"}
                        >
                          {slide.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {slide.is_editorial && (
                          <Badge variant="outline">Editorial</Badge>
                        )}
                      </div>

                      <p className="text-lg text-oma-plum font-medium mb-2">
                        {slide.hero_title}
                      </p>

                      {slide.subtitle && (
                        <p className="text-oma-cocoa mb-4 line-clamp-2">
                          {slide.subtitle}
                        </p>
                      )}

                      <div className="text-sm text-oma-cocoa">
                        <p>Display Order: {slide.display_order}</p>
                        <p>
                          Created:{" "}
                          {new Date(slide.created_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleMoveUp(index)}
                          disabled={index === 0 || reorderInFlight}
                          className="flex-1 sm:flex-none"
                          aria-label="Move slide up"
                        >
                          {reorderUpLoading(index) ? (
                            <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleMoveDown(index)}
                          disabled={
                            index === heroSlides.length - 1 || reorderInFlight
                          }
                          className="flex-1 sm:flex-none"
                          aria-label="Move slide down"
                        >
                          {reorderDownLoading(index) ? (
                            <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 sm:flex-none"
                        >
                          <NavigationLink href={`/studio/hero/${slide.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="ml-1 sm:hidden">Edit</span>
                          </NavigationLink>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(slide.id, slide.is_active)
                          }
                          disabled={isToggling === slide.id}
                          className="flex-1 sm:flex-none"
                        >
                          {isToggling === slide.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : slide.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="ml-1 sm:hidden">
                            {slide.is_active ? "Deactivate" : "Activate"}
                          </span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isDeleting === slide.id}
                              className="flex-1 sm:flex-none"
                            >
                              {isDeleting === slide.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="ml-1 sm:hidden">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Hero Slide
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{slide.title}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void handleDelete(slide.id)}
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
