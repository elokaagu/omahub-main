"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getEditionBySlug, type Edition } from "@/lib/data/editions";
import { editionFromContent } from "@/lib/editions/editionFromContent";
import {
  getEditionImages,
  addEditionImage,
  deleteEditionImage,
  updateEditionImage,
  type EditionImage,
} from "@/lib/services/editionImagesService";
import {
  describeStoryPhotoPosition,
  getStoryParagraphs,
} from "@/lib/editions/storyContent";
import { parseEditionVideo } from "@/lib/editions/editionVideoUrl";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { AutosaveIndicator } from "@/components/studio/AutosaveIndicator";
import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import { BlurIn } from "@/components/studio/BlurIn";
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
import { SuperAdminHeroGate } from "@/components/studio/SuperAdminGate";
import {
  EditionContentSection,
  buildInitialEditionDraft,
  type EditionEditorDraft,
} from "../components/EditionContentSection";
import { EditionLineupSection } from "../components/EditionLineupSection";
import {
  mergeLegacyStoryPhotosIntoHtml,
  plainStoryToHtml,
} from "@/lib/editions/storyHtml";
import {
  buildEditionEditorDraft,
  getEditionContent,
} from "@/lib/services/editionContentService";

export default function EditionPhotoManagementPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage editions">
      <EditionPhotoManagementContent slug={params.slug} />
    </SuperAdminHeroGate>
  );
}

function EditionPhotoManagementContent({ slug }: { slug: string }) {
  const { user } = useAuth();
  // Seeded editions come from the file; ones created in Studio are rebuilt
  // from their saved content row.
  const seededEdition = getEditionBySlug(slug);
  const [createdEdition, setCreatedEdition] = useState<Edition | null>(null);
  const [editionResolved, setEditionResolved] = useState(!!seededEdition);
  const edition = seededEdition ?? createdEdition;

  useEffect(() => {
    if (seededEdition) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await getEditionContent(slug);
        if (!cancelled && saved) setCreatedEdition(editionFromContent(saved));
      } catch (error) {
        console.error("Error loading edition:", error);
      } finally {
        if (!cancelled) setEditionResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, seededEdition]);
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
  const [isRemovingVideo, setIsRemovingVideo] = useState(false);
  const [contentDraft, setContentDraft] = useState<EditionEditorDraft | null>(
    null,
  );
  const [contentReady, setContentReady] = useState(false);
  const contentInitializedRef = useRef(false);

  const refetch = useCallback(async () => {
    const rows = await getEditionImages(slug);
    setImages(rows);
  }, [slug]);

  const bustPublicEdition = useCallback(async () => {
    try {
      await fetch(`/api/studio/editions/${slug}/revalidate`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("edition_revalidate_error", error);
    }
  }, [slug]);

  const videoDraft = useMemo(
    () => ({
      url: videoUrlInput,
      thumbnail: videoThumbnailInput,
      position: videoPosition,
    }),
    [videoUrlInput, videoThumbnailInput, videoPosition],
  );

  const videoBaseline = useMemo(() => {
    const currentVideo = images?.find((i) => i.kind === "video");
    return {
      url: currentVideo?.image_url || "",
      thumbnail: currentVideo?.alt_text || "",
      position: (currentVideo?.display_order === 1 ? 1 : 0) as 0 | 1,
    };
  }, [images]);

  const { status: videoAutosaveStatus, lastSavedAt: videoLastSavedAt } =
    useAutosave({
      data: videoDraft,
      baseline: images ? videoBaseline : undefined,
      enabled: Boolean(user && images),
      debounceMs: 900,
      shouldSkip: (draft) => !draft.url.trim(),
      onSave: async (draft) => {
        if (!user) return;
        await addEditionImage(user.id, {
          edition_slug: slug,
          image_url: draft.url.trim(),
          kind: "video",
          alt_text: draft.thumbnail.trim() || null,
          position: draft.position,
        });
        await refetch();
        await bustPublicEdition();
      },
    });

  useEffect(() => {
    if (!edition || images === null || contentInitializedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const saved = await getEditionContent(slug);
        if (cancelled) return;

        const storyPhotos = images.filter((image) => image.kind === "story");
        const baseDraft = buildEditionEditorDraft(
          edition,
          saved,
          plainStoryToHtml(edition.story),
        );
        const mergedHtml = mergeLegacyStoryPhotosIntoHtml(
          baseDraft.story_html,
          storyPhotos,
        );

        contentInitializedRef.current = true;
        setContentDraft({ ...baseDraft, story_html: mergedHtml });
      } catch (error) {
        console.error("Error loading edition content:", error);
        if (!cancelled && edition) {
          contentInitializedRef.current = true;
          setContentDraft(buildInitialEditionDraft(edition));
        }
      } finally {
        if (!cancelled) setContentReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, edition, images]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Prefill the video fields from the server - but only when the saved video
  // itself changes, and never over unsaved edits. `images` is refetched after
  // every cover/gallery/story/partner upload or delete; resetting the fields on
  // each of those used to wipe a video URL the user hadn't finished saving.
  const syncedVideoRef = useRef<string | null>(null);
  const videoInputsRef = useRef({ url: "", thumbnail: "", position: 0 });
  videoInputsRef.current = {
    url: videoUrlInput,
    thumbnail: videoThumbnailInput,
    position: videoPosition,
  };
  useEffect(() => {
    if (images === null) return;
    const video = images.find((i) => i.kind === "video");
    const server = {
      url: video?.image_url || "",
      thumbnail: video?.alt_text || "",
      position: (video?.display_order === 1 ? 1 : 0) as 0 | 1,
    };
    const serverKey = JSON.stringify(server);
    const previous = syncedVideoRef.current;
    if (serverKey === previous) return;

    const inputsKey = JSON.stringify(videoInputsRef.current);
    const hasUnsavedEdits = previous !== null && inputsKey !== previous;
    syncedVideoRef.current = serverKey;
    if (hasUnsavedEdits) return;

    setVideoUrlInput(server.url);
    setVideoThumbnailInput(server.thumbnail);
    setVideoPosition(server.position);
  }, [images]);

  if (!edition && !editionResolved) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-canela text-gray-900 mb-2">
          Edition not found
        </h1>
        <Button asChild>
          <NavigationLink href="/studio/editions">
            Back to Editions
          </NavigationLink>
        </Button>
      </div>
    );
  }

  if (!images || !contentReady || !contentDraft) {
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

  const handleCoverUpload = async (url: string) => {
    if (!user) return;
    try {
      setIsUploadingCover(true);
      if (!url.trim()) {
        if (cover) {
          await deleteEditionImage(user.id, cover.id);
          toast.success("Cover photo removed");
          await refetch();
          await bustPublicEdition();
        }
        return;
      }
      await addEditionImage(user.id, {
        edition_slug: slug,
        image_url: url,
        kind: "cover",
      });
      toast.success("Cover photo updated");
      await refetch();
      await bustPublicEdition();
    } catch (error) {
      console.error("Error setting cover photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update cover photo",
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
      await bustPublicEdition();
    } catch (error) {
      console.error("Error adding gallery photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add photo",
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
      await bustPublicEdition();
    } catch (error) {
      console.error("Error adding story photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add photo",
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
      await bustPublicEdition();
    } catch (error) {
      console.error("Error adding partner logo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add partner logo",
      );
    } finally {
      setIsUploadingPartner(false);
    }
  };

  const handleVideoRemove = async () => {
    if (!user || !video) return;
    try {
      setIsRemovingVideo(true);
      await deleteEditionImage(user.id, video.id);
      setVideoUrlInput("");
      setVideoThumbnailInput("");
      setVideoPosition(0);
      toast.success("Video removed");
      await refetch();
      await bustPublicEdition();
    } catch (error) {
      console.error("Error removing edition video:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove video",
      );
    } finally {
      setIsRemovingVideo(false);
    }
  };

  const handleStoryPhotoMove = async (id: string, position: number) => {
    if (!user) return;
    try {
      await updateEditionImage(user.id, id, { position });
      toast.success("Photo placement updated");
      await refetch();
      await bustPublicEdition();
    } catch (error) {
      console.error("Error moving story photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update placement",
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
      await bustPublicEdition();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove photo",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <BlurIn className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <NavigationLink href="/studio/editions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </NavigationLink>
          </Button>
          <div>
            <h1 className="text-3xl font-canela text-gray-900 mb-1">
              {contentDraft.title || edition.title}
            </h1>
            <p className="text-gray-600">
              Edition {contentDraft.edition_number || edition.number} · unified
              post editor
            </p>
          </div>
        </div>
      </BlurIn>

      <BlurIn className="mb-12 border-b border-gray-200 pb-12">
        <EditionContentSection
          slug={slug}
          staticEdition={edition}
          initialDraft={contentDraft}
        />
      </BlurIn>

      <BlurIn className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Hero cover
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Leads the archive card and the edition page hero. Uploading a new one
          replaces the current cover.
        </p>
        {effectiveCover && (
          <div className="mb-4 max-w-sm">
            <div className="overflow-hidden rounded-xl">
              <AuthImage
                src={effectiveCover}
                alt={edition.title}
                aspectRatio="portrait"
                className="w-full"
                sizes="400px"
                quality={80}
              />
            </div>
            <label
              htmlFor="edition-cover-upload"
              className="mt-3 inline-flex cursor-pointer text-sm font-medium text-gray-900 hover:underline"
            >
              Replace cover photo
            </label>
          </div>
        )}
        <FileUpload
          allowLibrary
          key={cover?.id ?? "no-cover"}
          inputId="edition-cover-upload"
          onUploadComplete={handleCoverUpload}
          bucket="edition-galleries"
          path={`${slug}/cover`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg", ".JPG", ".JPEG"],
            "image/webp": [".webp"],
          }}
          maxSize={20}
          hidePreview
        />
        {isUploadingCover && (
          <p className="mt-2 text-sm text-gray-600">Saving cover photo…</p>
        )}
      </BlurIn>

      <BlurIn className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Story sidebar video
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Appears to the right of &quot;The story&quot; on the edition page (or
          left, if you choose below). Paste a <strong>Vimeo link</strong> (e.g.
          vimeo.com/1206857643), a direct <strong>.mp4 URL</strong>, or upload a
          video file. Add an optional thumbnail for mp4 files — it shows before
          playback starts. Changes save automatically.
        </p>

        {video?.image_url &&
          (() => {
            const parsed = parseEditionVideo(video.image_url);
            return (
              <div className="mb-4 max-w-md overflow-hidden rounded-xl bg-oma-black ring-1 ring-gray-200">
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

        <label className="mb-2 block text-sm font-medium text-gray-900">
          Video URL
        </label>
        <input
          type="url"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="https://vimeo.com/1206857643 or https://.../recap.mp4"
          className="mb-4 w-full max-w-lg rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <p className="mb-2 text-xs text-gray-600">Or upload a video file</p>
        <FileUpload
          allowLibrary
          key={`video-upload-${video?.id ?? "none"}`}
          onUploadComplete={(url) => {
            setVideoUrlInput(url);
          }}
          bucket="edition-galleries"
          path={`${slug}/video`}
          accept={{
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/quicktime": [".mov"],
          }}
          maxSize={50}
          hidePreview
        />

        <label className="mb-2 mt-6 block text-sm font-medium text-gray-900">
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
          allowLibrary
          key={`video-thumb-${video?.id ?? "none"}-${videoThumbnailInput}`}
          onUploadComplete={(url) => {
            setVideoThumbnailInput(url);
          }}
          bucket="edition-galleries"
          path={`${slug}/video-thumbnail`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg", ".JPG", ".JPEG"],
            "image/webp": [".webp"],
          }}
          maxSize={10}
          hidePreview
        />

        <label className="mb-2 mt-6 block text-sm font-medium text-gray-900">
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
                : "border-gray-300 text-gray-900 hover:bg-gray-50",
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
                : "border-gray-300 text-gray-900 hover:bg-gray-50",
            )}
          >
            Left of the text
          </button>
        </div>

        <div className="flex items-center gap-3">
          <AutosaveIndicator
            status={videoAutosaveStatus}
            lastSavedAt={videoLastSavedAt}
          />
          {video && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRemovingVideo}
                >
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
      </BlurIn>

      {storyPhotos.length > 0 && (
        <BlurIn className="mb-12 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Legacy inline story photos
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These were placed between plain-text paragraphs. They are merged
            into the story editor above on load — save the story to keep them on
            the public page. Use the add photo button in the toolbar for new
            images.
          </p>
          <div className="space-y-4">
            {storyPhotos.map((image) => (
              <div
                key={image.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
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
                <p className="text-sm text-gray-600">
                  {describeStoryPhotoPosition(
                    image.display_order,
                    storyParagraphs.length,
                  )}
                </p>
              </div>
            ))}
          </div>
        </BlurIn>
      )}

      <BlurIn className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          In pictures (gallery)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Photo grid near the bottom of the edition page. Add images inline in
          the story editor above, or collect event photography here.
        </p>

        {gallery.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl"
              >
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
          allowLibrary
          key={gallery.length}
          onUploadComplete={handleGalleryUpload}
          bucket="edition-galleries"
          path={`${slug}/gallery`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg", ".JPG", ".JPEG"],
            "image/webp": [".webp"],
          }}
          maxSize={20}
          hidePreview
        />
        {isUploadingGallery && (
          <p className="mt-2 text-sm text-gray-600">Adding photo…</p>
        )}
      </BlurIn>

      <EditionLineupSection
        slug={slug}
        userId={user?.id ?? null}
        onChanged={bustPublicEdition}
      />

      <BlurIn className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Partners (bottom of page)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
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
                <p className="text-sm text-gray-900">
                  {partner.alt_text || (
                    <span className="italic text-gray-500">Unnamed</span>
                  )}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="Remove partner"
                      disabled={deletingId === partner.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove partner</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the logo from the edition&apos;s partners
                        strip. This action cannot be undone.
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

        <label className="mb-2 block text-sm font-medium text-gray-900">
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
          allowLibrary
          key={partners.length}
          onUploadComplete={handlePartnerUpload}
          bucket="edition-galleries"
          path={`${slug}/partners`}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg", ".JPG", ".JPEG"],
            "image/webp": [".webp"],
            "image/svg+xml": [".svg"],
          }}
          maxSize={5}
          hidePreview
        />
        {isUploadingPartner && (
          <p className="mt-2 text-sm text-gray-600">Adding partner logo…</p>
        )}
      </BlurIn>
    </div>
  );
}
