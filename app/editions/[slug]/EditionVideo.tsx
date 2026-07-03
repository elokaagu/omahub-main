"use client";

import dynamic from "next/dynamic";

const VideoPlayer = dynamic(
  () =>
    import("@/components/ui/video-player").then((m) => ({
      default: m.VideoPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse bg-oma-plum/20" />
    ),
  }
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
  return (
    <div className="overflow-hidden rounded-2xl">
      <VideoPlayer
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl}
        alt={`${title} — edition film`}
        className="aspect-video w-full"
        aspectRatio="16/9"
        sizes="(max-width: 1024px) 100vw, 1024px"
        quality={90}
        muted={true}
        loop={false}
        controls={true}
        showPlayButton={true}
      />
    </div>
  );
}
