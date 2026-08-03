"use client";

import dynamic from "next/dynamic";
import { parseEditionVideo } from "@/lib/editions/editionVideoUrl";

const VideoPlayer = dynamic(
  () =>
    import("@/components/ui/video-player").then((m) => ({
      default: m.VideoPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-oma-plum/10" />
    ),
  },
);

type EditionVideoProps = {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
};

export function EditionVideo({
  videoUrl,
  thumbnailUrl,
  title,
}: EditionVideoProps) {
  const parsed = parseEditionVideo(videoUrl);

  if (parsed?.type === "vimeo") {
    return (
      <div className="overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-oma-cocoa/10">
        <div className="aspect-video w-full">
          <iframe
            src={parsed.embedUrl}
            title={`${title}, edition film`}
            allow="autoplay; fullscreen; picture-in-picture"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-oma-cocoa/10">
      <VideoPlayer
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl}
        alt={`${title}, edition film`}
        className="aspect-video w-full"
        aspectRatio="16/9"
        sizes="(max-width: 1024px) 100vw, 480px"
        quality={90}
        muted
        loop={false}
        controls
        showPlayButton
      />
    </div>
  );
}
