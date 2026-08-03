"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getEditionBySlug } from "@/lib/data/editions";
import {
  getEditionImages,
  addEditionImage,
  deleteEditionImage,
  updateEditionImage,
  type EditionImage,
} from "@/lib/services/editionImagesService";
import {
  getEditionLineup,
  addEditionLineupBrand,
  deleteEditionLineupBrand,
  type EditionLineupBrand,
} from "@/lib/services/editionLineupService";
import { getAllBrands } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";
import {
  describeStoryPhotoPosition,
  getStoryParagraphs,
} from "@/lib/editions/storyContent";
import { parseEditionVideo } from "@/lib/editions/editionVideoUrl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandCard } from "@/components/ui/brand-card";

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
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyPosition, setStoryPosition] = useState(-1);
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoThumbnailInput, setVideoThumbnailInput] = useState("");
  const [videoPosition, setVideoPosition] = useState<0 | 1>(0);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [lineupEntries, setLineupEntries] = useState<EditionLineupBrand[] | null>(
    null,
  );
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [selectedLineupBrandId, setSelectedLineupBrandId] = useState("");
  const [isAddingLineupBrand, setIsAddingLineupBrand] = useState(false);
  const [deletingLineupId, setDeletingLineupId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const rows = await getEditionImages(slug);
    setImages(rows);
  }, [slug]);

  const refetchLineup = useCallback(async () => {
    const rows = await getEditionLineup(slug);
    setLineupEntries(rows);
  }, [slug]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    void refetchLineup();
  }, [refetchLineup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const brands = await getAllBrands();
        if (!cancelled) setAllBrands(brands);
      } catch (error) {
        console.error("Error loading brands for lineup:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill the video fields once the current one loads (or changes).
  useEffect(() => {
    const video = images?.find((i) => i.kind === "video");
    setVideoUrlInput(video?.image_url || "");
    setVideoThumbnailInput(video?.alt_text || "");
    setVideoPosition(video?.display_order === 1 ? 1 : 0);
  }, [images]);

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

  if (!images || lineupEntries === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const cover = images.find((i) => i.kind === "cover");
  const video = images.find((i) => i.kind === "video");
  const gallery = images.filter((i) => i.kind === "gallery");
  const storyPhotos = images
    .filter((i) => i.kind === "story")
    .sort((a, b) => a.display_order - b.display_order);
  const partners = images
    .filter((i) => i.kind === "partner")
    .sort((a, b) => a.display_order - b.display_order);
  const effectiveCover = cover?.image_url || edition.coverImage;
  const storyParagraphs = getStoryParagraphs(edition.story);
  const lineupBrandIds = new Set(lineupEntries.map((entry) => entry.brand_id));
  const lineupBrands = lineupEntries
    .map((entry) => allBrands.find((brand) => brand.id === entry.brand_id))
    .filter((brand): brand is Brand => Boolean(brand));
  const availableLineupBrands = allBrands.filter(
    (brand) => !lineupBrandIds.has(brand.id),
  );

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

  const handleStoryUpload = async (url: string) => {
    if (!user) return;
    try {
      setIsUploadingStory(true);
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "story",
        alt_text: edition.title,
        position: storyPosition,
      });
      toast.success("Photo added to the story");
      await refetch();
    } catch (error) {
      console.error("Error adding story photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add photo"
      );
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handlePartnerUpload = async (url: string) => {
    if (!user) return;
    try {
      setIsUploadingPartner(true);
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "partner",
        alt_text: partnerName.trim() || null,
      });
      toast.success("Partner logo added");
      setPartnerName("");
      await refetch();
    } catch (error) {
      console.error("Error adding partner logo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add partner logo"
      );
    } finally {
      setIsUploadingPartner(false);
    }
  };

  const handleVideoSave = async () => {
    if (!user) return;
    const url = videoUrlInput.trim();
    if (!url) {
      toast.error("Add a video URL first");
      return;
    }
    try {
      setIsSavingVideo(true);
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "video",
        alt_text: videoThumbnailInput.trim() || null,
        position: videoPosition,
      });
      toast.success("Video updated");
      await refetch();
    } catch (error) {
      console.error("Error setting edition video:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update video"
      );
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleVideoRemove = async () => {
    if (!user || !video) return;
    try {
      setIsSavingVideo(true);
      await deleteEditionImage(user.id, video.id);
      toast.success("Video removed");
      await refetch();
    } catch (error) {
      console.error("Error removing edition video:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove video"
      );
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleStoryPhotoMove = async (id: string, position: number) => {
    if (!user) return;
    try {
      await updateEditionImage(user.id, id, { position });
      toast.success("Photo placement updated");
      await refetch();
    } catch (error) {
      console.error("Error moving story photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update placement"
      );
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

  const handleAddLineupBrand = async () => {
    if (!user || !selectedLineupBrandId) return;
    try {
      setIsAddingLineupBrand(true);
      await addEditionLineupBrand(user.id, {
        edition_slug: slug,
        brand_id: selectedLineupBrandId,
      });
      toast.success("Brand added to lineup");
      setSelectedLineupBrandId("");
      await refetchLineup();
    } catch (error) {
      console.error("Error adding lineup brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add brand",
      );
    } finally {
      setIsAddingLineupBrand(false);
    }
  };

  const handleRemoveLineupBrand = async (id: string) => {
    if (!user) return;
    try {
      setDeletingLineupId(id);
      await deleteEditionLineupBrand(user.id, id);
      toast.success("Brand removed from lineup");
      await refetchLineup();
    } catch (error) {
      console.error("Error removing lineup brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove brand",
      );
    } finally {
      setDeletingLineupId(null);
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
          Story sidebar video
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Appears to the right of &quot;The story&quot; on the edition page
          (or left, if you choose below). Paste a{" "}
          <strong>Vimeo link</strong> (e.g. vimeo.com/1206857643), a direct{" "}
          <strong>.mp4 URL</strong>, or upload a video file. Add an optional
          thumbnail for mp4 files — it shows before playback starts.
        </p>

        {video?.image_url && (() => {
          const parsed = parseEditionVideo(video.image_url);
          return (
            <div className="mb-4 max-w-md overflow-hidden rounded-xl bg-oma-black ring-1 ring-oma-cocoa/10">
              {parsed?.type === "vimeo" ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={parsed.embedUrl}
                    title="Edition video preview"
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <video
                  key={video.id}
                  src={video.image_url}
                  poster={video.alt_text || undefined}
                  controls
                  className="aspect-video w-full"
                />
              )}
            </div>
          );
        })()}

        <label className="mb-2 block text-sm font-medium text-oma-black">
          Video URL
        </label>
        <input
          type="url"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="https://vimeo.com/1206857643 or https://.../recap.mp4"
          className="mb-4 w-full max-w-lg rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <p className="mb-2 text-xs text-oma-cocoa/80">Or upload a video file</p>
        <FileUpload
          key={`video-upload-${video?.id ?? "none"}`}
          onUploadComplete={(url) => {
            setVideoUrlInput(url);
            toast.success("Video uploaded — click Save video to publish");
          }}
          bucket="edition-galleries"
          path={`${slug}/video`}
          accept={{
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/quicktime": [".mov"],
          }}
          maxSize={150}
          hidePreview
        />

        <label className="mb-2 mt-6 block text-sm font-medium text-oma-black">
          Thumbnail URL (optional, for mp4 files)
        </label>
        <input
          type="url"
          value={videoThumbnailInput}
          onChange={(e) => setVideoThumbnailInput(e.target.value)}
          placeholder="https://.../recap-thumbnail.jpg"
          className="mb-3 w-full max-w-lg rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <FileUpload
          key={`video-thumb-${video?.id ?? "none"}-${videoThumbnailInput}`}
          onUploadComplete={(url) => {
            setVideoThumbnailInput(url);
            toast.success("Thumbnail uploaded — click Save video to apply");
          }}
          bucket="edition-galleries"
          path={`${slug}/video-thumbnail`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
          }}
          maxSize={10}
          hidePreview
        />

        <label className="mb-2 mt-6 block text-sm font-medium text-oma-black">
          Position next to the story
        </label>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setVideoPosition(0)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              videoPosition === 0
                ? "border-oma-black bg-oma-black text-white"
                : "border-gray-300 text-oma-black hover:bg-gray-50"
            )}
          >
            Right of the text
          </button>
          <button
            type="button"
            onClick={() => setVideoPosition(1)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              videoPosition === 1
                ? "border-oma-black bg-oma-black text-white"
                : "border-gray-300 text-oma-black hover:bg-gray-50"
            )}
          >
            Left of the text
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void handleVideoSave()}
            disabled={isSavingVideo}
          >
            {isSavingVideo ? "Saving…" : video ? "Update video" : "Save video"}
          </Button>
          {video && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={isSavingVideo}>
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove video</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the video from the edition page. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleVideoRemove()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Inline story photos
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Placed inside &quot;The story&quot; on the edition page — between
          paragraphs, not in the gallery grid at the bottom. Paragraphs come
          from the story text in lib/data/editions.ts (split on blank lines).
        </p>

        {storyPhotos.length > 0 && (
          <div className="mb-6 space-y-4">
            {storyPhotos.map((image) => (
              <div
                key={image.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"
              >
                <div className="group relative w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl">
                  <AuthImage
                    src={image.image_url}
                    alt={image.alt_text || edition.title}
                    aspectRatio="landscape"
                    className="w-full"
                    sizes="220px"
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
                          This removes it from the story. This action cannot be
                          undone.
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

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-oma-black">
                    {describeStoryPhotoPosition(
                      image.display_order,
                      storyParagraphs.length,
                    )}
                  </p>
                  {storyParagraphs.length > 0 && (
                    <label className="mt-3 block text-xs font-medium uppercase tracking-[0.12em] text-oma-cocoa">
                      Move to
                    </label>
                  )}
                  {storyParagraphs.length > 0 && (
                    <select
                      value={image.display_order}
                      onChange={(e) =>
                        void handleStoryPhotoMove(
                          image.id,
                          Number(e.target.value),
                        )
                      }
                      className="mt-1 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value={-1}>Before the first paragraph</option>
                      {storyParagraphs.map((paragraph, index) => (
                        <option key={index} value={index}>
                          After paragraph {index + 1}: &quot;
                          {paragraph.slice(0, 40)}
                          {paragraph.length > 40 ? "…" : ""}&quot;
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {storyParagraphs.length > 0 ? (
          <>
            <label className="mb-2 block text-sm font-medium text-oma-black">
              Insert photo
            </label>
            <select
              value={storyPosition}
              onChange={(e) => setStoryPosition(Number(e.target.value))}
              className="mb-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value={-1}>Before the first paragraph</option>
              {storyParagraphs.map((paragraph, index) => (
                <option key={index} value={index}>
                  After paragraph {index + 1}: &quot;{paragraph.slice(0, 40)}
                  {paragraph.length > 40 ? "…" : ""}&quot;
                </option>
              ))}
            </select>
            <FileUpload
              key={`${storyPosition}-${storyPhotos.length}`}
              onUploadComplete={handleStoryUpload}
              bucket="edition-galleries"
              path={`${slug}/story`}
              accept={{
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
              }}
              maxSize={20}
              hidePreview
            />
            {isUploadingStory && (
              <p className="mt-2 text-sm text-oma-cocoa">Adding photo…</p>
            )}
          </>
        ) : (
          <p className="text-sm text-oma-cocoa/70">
            This edition has no story text yet, so there&apos;s nowhere to
            place an inline photo. Add the story in lib/data/editions.ts first.
          </p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Gallery grid (bottom of page)
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Shown together in the &quot;In pictures&quot; section near the bottom
          of the edition page — not inline with the story. Use &quot;Inline
          story photos&quot; above to place images between paragraphs.
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

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Lineup brands
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Brands that showed at this edition — rendered as the scrolling
          &quot;The lineup&quot; row on the edition page, using the same cards
          as the homepage brand rows. The lineup label on the archive card
          {edition.lineupLabel
            ? ` (${edition.lineupLabel})`
            : ""}{" "}
          still comes from code.
        </p>

        {lineupBrands.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lineupEntries.map((entry) => {
              const brand = allBrands.find((b) => b.id === entry.brand_id);
              if (!brand) return null;

              return (
                <div key={entry.id} className="group relative">
                  <BrandCard
                    id={brand.id}
                    name={brand.name}
                    image={brand.image || "/placeholder-image.jpg"}
                    category={brand.category}
                    location={brand.location}
                    isVerified={brand.is_verified}
                    rating={brand.rating}
                    video_url={brand.video_url || undefined}
                    video_thumbnail={brand.video_thumbnail || undefined}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Remove ${brand.name} from lineup`}
                        disabled={deletingLineupId === entry.id}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-oma-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from lineup</AlertDialogTitle>
                        <AlertDialogDescription>
                          {brand.name} will no longer appear in the edition&apos;s
                          brand row. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleRemoveLineupBrand(entry.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 max-w-md">
            <label className="mb-2 block text-sm font-medium text-oma-black">
              Add brand from directory
            </label>
            <Select
              value={selectedLineupBrandId || "__none"}
              onValueChange={(value) =>
                setSelectedLineupBrandId(value === "__none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Select a brand</SelectItem>
                {availableLineupBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={() => void handleAddLineupBrand()}
            disabled={!selectedLineupBrandId || isAddingLineupBrand}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            {isAddingLineupBrand ? "Adding…" : "Add to lineup"}
          </Button>
        </div>

        {lineupBrands.length === 0 && (
          <p className="mt-4 text-sm text-oma-cocoa/70">
            No lineup brands yet. Add brands above to populate the scrolling row
            at the bottom of the edition page.
          </p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Partners (bottom of page)
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Logos and names shown in the &quot;Our partners&quot; section at the
          very bottom of the edition page — after the story, gallery, and brand
          lineup. Any partner name set in lib/data/editions.ts also appears
          here.
        </p>

        {partners.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="group relative flex items-center gap-3 rounded-xl border border-gray-200 p-3"
              >
                <img
                  src={partner.image_url}
                  alt={partner.alt_text || "Partner"}
                  className="h-10 w-20 shrink-0 object-contain"
                />
                <p className="text-sm text-oma-black">
                  {partner.alt_text || (
                    <span className="italic text-oma-cocoa/60">Unnamed</span>
                  )}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="Remove partner"
                      disabled={deletingId === partner.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-oma-cocoa/60 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove partner</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the logo from the edition&apos;s
                        partners strip. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleDelete(partner.id)}
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

        <label className="mb-2 block text-sm font-medium text-oma-black">
          Partner name
        </label>
        <input
          type="text"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="e.g. Gather House Africa"
          className="mb-4 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <FileUpload
          key={partners.length}
          onUploadComplete={handlePartnerUpload}
          bucket="edition-galleries"
          path={`${slug}/partners`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
            "image/svg+xml": [".svg"],
          }}
          maxSize={5}
          hidePreview
        />
        {isUploadingPartner && (
          <p className="mt-2 text-sm text-oma-cocoa">Adding partner logo…</p>
        )}
      </section>
    </div>
  );
}
