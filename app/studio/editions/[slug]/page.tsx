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
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyPosition, setStoryPosition] = useState(0);
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoThumbnailInput, setVideoThumbnailInput] = useState("");
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  const refetch = useCallback(async () => {
    const rows = await getEditionImages(slug);
    setImages(rows);
  }, [slug]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Prefill the video fields once the current one loads (or changes).
  useEffect(() => {
    const video = images?.find((i) => i.kind === "video");
    setVideoUrlInput(video?.image_url || "");
    setVideoThumbnailInput(video?.alt_text || "");
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

  if (!images) {
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
  const storyParagraphs = edition.story
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

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
        <h2 className="text-lg font-semibold text-oma-black mb-1">Video</h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Plays alongside &quot;The story&quot; on the edition page. Paste a
          direct link to a video file (e.g. an .mp4 URL) - a new one replaces
          the current video. The thumbnail shows before playback starts.
        </p>

        {video?.image_url && (
          <div className="mb-4 max-w-sm overflow-hidden rounded-xl bg-oma-black">
            <video
              key={video.id}
              src={video.image_url}
              poster={video.alt_text || undefined}
              controls
              className="aspect-video w-full"
            />
          </div>
        )}

        <label className="mb-2 block text-sm font-medium text-oma-black">
          Video URL
        </label>
        <input
          type="url"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="https://.../edition-recap.mp4"
          className="mb-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-2 block text-sm font-medium text-oma-black">
          Thumbnail URL (optional)
        </label>
        <input
          type="url"
          value={videoThumbnailInput}
          onChange={(e) => setVideoThumbnailInput(e.target.value)}
          placeholder="https://.../edition-recap-thumbnail.jpg"
          className="mb-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

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

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Story photos
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Dropped in between paragraphs of &quot;The story&quot; on the
          edition page. Paragraphs are split on blank lines in the story
          text (lib/data/editions.ts).
        </p>

        {storyPhotos.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {storyPhotos.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-xl">
                <AuthImage
                  src={image.image_url}
                  alt={image.alt_text || edition.title}
                  aspectRatio="landscape"
                  className="w-full"
                  sizes="200px"
                  quality={70}
                />
                <span className="absolute left-2 top-2 rounded-full bg-oma-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  After ¶{image.display_order + 1}
                </span>
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
            ))}
          </div>
        )}

        {storyParagraphs.length > 0 ? (
          <>
            <label className="mb-2 block text-sm font-medium text-oma-black">
              Insert after paragraph
            </label>
            <select
              value={storyPosition}
              onChange={(e) => setStoryPosition(Number(e.target.value))}
              className="mb-4 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {storyParagraphs.map((paragraph, i) => (
                <option key={i} value={i}>
                  Paragraph {i + 1}: &quot;{paragraph.slice(0, 40)}
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
            place a photo. Add the story in lib/data/editions.ts first.
          </p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-oma-black mb-1">
          Partners
        </h2>
        <p className="text-sm text-oma-cocoa mb-4">
          Logos shown in the &quot;Our partners&quot; strip underneath the
          edition (e.g. venues, co-hosts).
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
