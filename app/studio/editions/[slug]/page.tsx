"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEditionBySlug } from "@/lib/data/editions";
import {
  getEditionImages,
  addEditionImage,
  deleteEditionImage,
  type EditionImage,
} from "@/lib/services/editionImagesService";
import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
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
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminHeroGate } from "@/app/studio/hero/SuperAdminHeroGate";

export default function EditionPhotoManagementPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage edition photos">
      <EditionPhotoManagementContent slug={params.slug} />
    </SuperAdminHeroGate>
  );
}

function EditionPhotoManagementContent({ slug }: { slug: string }) {
  const { user } = useAuth();
  const edition = getEditionBySlug(slug);
  const [images, setImages] = useState<EditionImage[] | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const rows = await getEditionImages(slug);
    setImages(rows);
  }, [slug]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  if (!edition) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-oma-black mb-2">
          Edition not found
        </h1>
        <Button asChild>
          <NavigationLink href="/studio/editions">Back to Edition Photos</NavigationLink>
        </Button>
      </div>
    );
  }

  if (!images) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const cover = images.find((i) => i.kind === "cover");
  const gallery = images.filter((i) => i.kind === "gallery");
  const effectiveCover = cover?.image_url || edition.coverImage;

  const handleCoverUpload = async (url: string) => {
    if (!user) return;
    try {
      setIsUploadingCover(true);
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "cover",
      });
      toast.success("Cover photo updated");
      await refetch();
    } catch (error) {
      console.error("Error setting cover photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update cover photo"
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (url: string) => {
    if (!user) return;
    try {
      setIsUploadingGallery(true);
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "gallery",
        alt_text: edition.title,
      });
      toast.success("Photo added to gallery");
      await refetch();
    } catch (error) {
      console.error("Error adding gallery photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add photo"
      );
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setDeletingId(id);
      await deleteEditionImage(user.id, id);
      toast.success("Photo removed");
      await refetch();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove photo"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <NavigationLink href="/studio/editions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </NavigationLink>
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-1">
            {edition.title}
          </h1>
          <p className="text-oma-cocoa">
            Edition {edition.number} · {edition.dateLabel}
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Cover photo
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Leads the archive card and the edition page hero. Uploading a new
          one replaces the current cover.
        </p>
        {effectiveCover && (
          <div className="mb-4 max-w-sm overflow-hidden rounded-xl">
            <AuthImage
              src={effectiveCover}
              alt={edition.title}
              aspectRatio="portrait"
              className="w-full"
              sizes="400px"
              quality={80}
            />
          </div>
        )}
        <FileUpload
          key={cover?.id ?? "no-cover"}
          onUploadComplete={handleCoverUpload}
          bucket="edition-galleries"
          path={`${slug}/cover`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
          }}
          maxSize={20}
          hidePreview
        />
        {isUploadingCover && (
          <p className="mt-2 text-sm text-oma-cocoa">Saving cover photo…</p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Gallery photos
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Shown in the &quot;In pictures&quot; section on the edition page.
          Added here in addition to any photos already in the codebase.
        </p>

        {gallery.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-xl">
                <AuthImage
                  src={image.image_url}
                  alt={image.alt_text || edition.title}
                  aspectRatio="portrait"
                  className="w-full"
                  sizes="200px"
                  quality={70}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      disabled={deletingId === image.id}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-oma-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove photo</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes it from the edition&apos;s gallery. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleDelete(image.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        <FileUpload
          key={gallery.length}
          onUploadComplete={handleGalleryUpload}
          bucket="edition-galleries"
          path={`${slug}/gallery`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
          }}
          maxSize={20}
          hidePreview
        />
        {isUploadingGallery && (
          <p className="mt-2 text-sm text-oma-cocoa">Adding photo…</p>
        )}

        {edition.gallery && edition.gallery.length > 0 && (
          <p className="mt-6 text-xs text-oma-cocoa/70">
            {edition.gallery.length} additional gallery{" "}
            {edition.gallery.length === 1 ? "photo is" : "photos are"} seeded
            in code (lib/data/editions.ts) and always shown alongside these.
          </p>
        )}
      </section>
    </div>
  );
}
