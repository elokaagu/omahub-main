"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoUpload } from "@/components/ui/video-upload";
import { cn } from "@/lib/utils";
import { savePlatformSetting } from "@/app/studio/settings/savePlatformSetting";

type HomepageFilmCardProps = {
  /** Numeric Vimeo id, used when no video has been uploaded. */
  initialVideoId: string;
  /** Uploaded video URL; when set it replaces the Vimeo film. */
  initialFilmUrl: string;
  /** The film the public site falls back to when nothing has been set. */
  defaultVideoId: string;
};

type Source = "upload" | "vimeo";

/**
 * The full-bleed film below the archive on the homepage. It can come from
 * a video uploaded here or from a Vimeo ID - whichever was set last wins.
 */
export function HomepageFilmCard({
  initialVideoId,
  initialFilmUrl,
  defaultVideoId,
}: HomepageFilmCardProps) {
  const [filmUrl, setFilmUrl] = useState(initialFilmUrl);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [source, setSource] = useState<Source>(
    initialFilmUrl ? "upload" : "vimeo",
  );
  const [saving, setSaving] = useState(false);

  const save = async (
    update: Record<string, string>,
    successMessage: string,
  ) => {
    setSaving(true);
    const error = await savePlatformSetting(
      update,
      "Failed to update the homepage film",
    );
    setSaving(false);
    if (error) {
      toast.error(error);
      return false;
    }
    toast.success(successMessage);
    return true;
  };

  const saveUpload = async (url: string) => {
    // Clearing the Vimeo id keeps one obvious source of truth.
    if (await save({ homepageFilmUrl: url }, "Homepage film updated")) {
      setFilmUrl(url);
      setSource("upload");
    }
  };

  const saveVimeo = async () => {
    const trimmed = videoId.trim();
    if (!/^\d+$/.test(trimmed)) {
      toast.error("Enter just the numeric Vimeo video ID");
      return;
    }
    if (
      await save(
        { heroVideoId: trimmed, homepageFilmUrl: "" },
        "Homepage film updated",
      )
    ) {
      setFilmUrl("");
      setSource("vimeo");
    }
  };

  const removeUpload = async () => {
    if (await save({ homepageFilmUrl: "" }, "Upload removed - using Vimeo")) {
      setFilmUrl("");
      setSource("vimeo");
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-canela text-gray-900">
          <Film className="h-5 w-5" />
          Homepage film
        </CardTitle>
        <CardDescription className="text-gray-600">
          The full-width film below the archive on the public homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* With nothing set the site still plays its built-in film, so say
            which one rather than "not set". */}
        <p className="text-sm text-gray-600">
          Currently playing:{" "}
          <span className="font-medium text-gray-900">
            {filmUrl
              ? "an uploaded video"
              : `Vimeo ${videoId.trim() || defaultVideoId}`}
          </span>
          {!filmUrl && !videoId.trim() && " (the built-in film)"}
        </p>

        {filmUrl && (
          <video
            key={filmUrl}
            src={filmUrl}
            className="h-52 w-full max-w-md rounded-xl border border-gray-200 bg-gray-900 object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        )}

        <div
          role="tablist"
          aria-label="Film source"
          className="inline-flex rounded-full border border-gray-200 p-1"
        >
          {(["upload", "vimeo"] as Source[]).map((option) => (
            <button
              key={option}
              role="tab"
              type="button"
              aria-selected={source === option}
              onClick={() => setSource(option)}
              className={cn(
                "min-h-[36px] rounded-full px-4 text-sm transition-colors",
                source === option
                  ? "bg-oma-plum text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              {option === "upload" ? "Upload a video" : "Vimeo link"}
            </button>
          ))}
        </div>

        {source === "upload" ? (
          <div className="space-y-3">
            <VideoUpload
              key={`homepage-film-${filmUrl || "empty"}`}
              onUploadComplete={(url) => void saveUpload(url)}
              defaultValue={filmUrl}
              bucket="spotlight-videos"
              path="homepage-film"
              maxSize={80}
            />
            <p className="text-xs text-gray-500">
              MP4, WebM or MOV, up to 80MB. Plays muted and on a loop, so keep
              it short.
            </p>
            {filmUrl && (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void removeUpload()}
              >
                Remove upload and use Vimeo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="homepage-film-vimeo">Vimeo video ID</Label>
              <Input
                id="homepage-film-vimeo"
                value={videoId}
                onChange={(event) => setVideoId(event.target.value)}
                placeholder="1206857643"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-500">
                Just the number from the URL, e.g. the 1206857643 in
                vimeo.com/1206857643.
              </p>
            </div>
            <Button
              onClick={() => void saveVimeo()}
              disabled={saving}
              className="bg-oma-plum hover:bg-oma-plum/90 text-white"
            >
              {saving ? "Saving…" : "Use this Vimeo film"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
