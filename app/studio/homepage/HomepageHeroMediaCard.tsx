"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { DEFAULT_HERO_MEDIA_SRC, isHeroVideoSrc } from "@/lib/home/heroMedia";

type HomepageHeroMediaCardProps = {
  /** Saved value from the server; the card keeps its own copy after edits. */
  initialMediaUrl: string;
};

async function persistHeroMediaUrl(url: string): Promise<boolean> {
  const response = await fetch("/api/platform-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heroMediaUrl: url }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    toast.error(data.error || "Failed to update the homepage hero");
    return false;
  }
  return true;
}

export function HomepageHeroMediaCard({
  initialMediaUrl,
}: HomepageHeroMediaCardProps) {
  const [mediaUrl, setMediaUrl] = useState(initialMediaUrl);
  const [saving, setSaving] = useState(false);
  const current = mediaUrl.trim();
  const previewSrc = current || DEFAULT_HERO_MEDIA_SRC;
  const previewIsVideo = isHeroVideoSrc(previewSrc);
  const imageValue = current && !isHeroVideoSrc(current) ? current : "";
  const videoValue = current && isHeroVideoSrc(current) ? current : "";

  const save = async (url: string, successMessage: string) => {
    setSaving(true);
    try {
      const ok = await persistHeroMediaUrl(url);
      if (ok) {
        setMediaUrl(url);
        toast.success(successMessage);
      }
    } catch (error) {
      console.error("Error saving homepage hero media:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 font-canela">
          <ImageIcon className="h-5 w-5" />
          Homepage Hero
        </CardTitle>
        <CardDescription className="text-gray-600">
          The portrait still or looping film at the top of the public homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-600">
          Upload a photo or an MP4. This is the card beside the headline, not
          the mid-page Vimeo film below.
        </p>

        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {previewIsVideo ? (
              <video
                key={previewSrc}
                src={previewSrc}
                className="h-64 w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewSrc}
                src={previewSrc}
                alt="Current homepage hero"
                className="h-64 w-full object-cover"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Still</p>
              <FileUpload
                key={`hero-image-${imageValue || "empty"}`}
                onUploadComplete={(url) => {
                  void save(url, "Homepage hero image updated");
                }}
                defaultValue={imageValue}
                bucket="hero-images"
                path="homepage"
                accept={{
                  "image/jpeg": [".jpg", ".jpeg", ".jpe", ".jfif"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                }}
                maxSize={20}
              />
              <p className="text-xs text-gray-500">
                JPG, PNG, or WebP. Max 20MB.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Film</p>
              <VideoUpload
                key={`hero-video-${videoValue || "empty"}`}
                onUploadComplete={(url) => {
                  if (!url) return;
                  void save(url, "Homepage hero film updated");
                }}
                defaultValue={videoValue}
                bucket="spotlight-videos"
                path="homepage-hero"
                accept="video/mp4,.mp4,video/webm,.webm,video/quicktime,.mov"
                maxSize={80}
              />
              <p className="text-xs text-gray-500">
                MP4, WebM, or MOV. Max 80MB.
              </p>
            </div>
          </div>
        </>
      </CardContent>
      {current ? (
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() =>
              void save("", "Homepage hero reset to the default film")
            }
            className="w-full"
          >
            {saving ? "Saving…" : "Use default film"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
