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
import { savePlatformSetting } from "@/app/studio/settings/savePlatformSetting";

type ArchiveHeroCardProps = {
  /** Saved setting; empty means "use the latest edition cover". */
  initialImageUrl: string;
  /** Shown when nothing is set, so the preview matches the live page. */
  fallbackImageUrl?: string;
};

/** Banner photo at the top of the public /editions archive. */
export function ArchiveHeroCard({
  initialImageUrl,
  fallbackImageUrl,
}: ArchiveHeroCardProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [saving, setSaving] = useState(false);
  const preview = imageUrl || fallbackImageUrl || "";

  const save = async (url: string, successMessage: string) => {
    setSaving(true);
    const error = await savePlatformSetting(
      { archiveHeroImage: url },
      "Failed to update the experiences banner",
    );
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setImageUrl(url);
    toast.success(successMessage);
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-canela text-gray-900">
          <ImageIcon className="h-5 w-5" />
          Experiences banner
        </CardTitle>
        <CardDescription className="text-gray-600">
          The photo behind &ldquo;Experiences&rdquo; on the public editions page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-gray-600">
          {imageUrl
            ? "This photo is set for the experiences banner."
            : "No banner set - the page is using the newest past edition's cover."}
        </p>

        {preview && (
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote preview */}
            <img
              key={preview}
              src={preview}
              alt="Current experiences banner"
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        <FileUpload
          allowLibrary
          key={`archive-hero-${imageUrl || "empty"}`}
          onUploadComplete={(url) => void save(url, "Experiences banner updated")}
          defaultValue={imageUrl}
          bucket="hero-images"
          path="editions-archive"
          accept={{
            "image/jpeg": [".jpg", ".jpeg", ".jpe", ".jfif"],
            "image/png": [".png"],
            "image/webp": [".webp"],
          }}
          maxSize={20}
          hidePreview
        />
      </CardContent>
      {imageUrl && (
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() =>
              void save(
                "",
                "Experiences banner reset to the latest edition cover"
              )
            }
            className="w-full"
          >
            {saving ? "Saving…" : "Use the latest edition cover"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
