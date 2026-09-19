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
import {
  DEFAULT_HERO_MEDIA_SRC,
  isHeroVideoSrc,
} from "@/lib/home/heroMedia";

type HomepageHeroMediaCardProps = {
  mediaUrl: string;
  loading: boolean;
  onSaved: (url: string) => void;
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
  mediaUrl,
  loading,
  onSaved,
}: HomepageHeroMediaCardProps) {
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
        onSaved(url);
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
    <Card className="border-oma-beige">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
          <ImageIcon className="h-5 w-5" />
          Homepage Hero
        </CardTitle>
        <CardDescription className="text-oma-cocoa">
          The portrait still or looping film at the top of the public homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-oma-cocoa/80">
          Upload a photo or an MP4. This is the card beside the headline, not
          the mid-page Vimeo film below.
        </p>

        {loading ? (
          <div className="text-center py-6">
            <div className="h-5 w-5 border-2 border-oma-plum border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-oma-gold/40 bg-oma-black/10">
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
                <p className="text-sm font-medium text-oma-black">Still</p>
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
                <p className="text-xs text-oma-cocoa/70">JPG, PNG, or WebP. Max 20MB.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-oma-black">Film</p>
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
                <p className="text-xs text-oma-cocoa/70">MP4, WebM, or MOV. Max 80MB.</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {current ? (
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving || loading}
            onClick={() => void save("", "Homepage hero reset to the default film")}
            className="w-full"
          >
            {saving ? "Saving…" : "Use default film"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
