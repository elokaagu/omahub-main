"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";
import { Mail, CalendarClock, Sparkles } from "lucide-react";

export default function StudioWelcomePage() {
  const { user, loading } = useAuth();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/platform-settings");
        const data = await res.json();
        if (!cancelled && typeof data.welcomeVideoId === "string") {
          setVideoId(data.welcomeVideoId || null);
        }
      } catch (error) {
        console.error("Error fetching welcome video:", error);
      } finally {
        if (!cancelled) setIsLoadingVideo(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
          Welcome to OmaHub
        </p>
        <h1 className="mt-2 text-3xl font-canela text-oma-plum">
          Here&apos;s how OmaHub works
        </h1>
      </div>

      {!isLoadingVideo && videoId && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-black">
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Welcome to OmaHub"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-oma-gold/20 bg-oma-beige/40 p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-oma-black/80">
          OmaHub is where African fashion finds its audience: storytelling-led
          editions and a verified directory that helps people discover
          designers like you. Right now, we&apos;re focused on building
          awareness rather than running checkout on the site directly - your
          Studio profile is what customers see, and it&apos;s how they get in
          touch with you.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-oma-cocoa/15 p-5">
          <Mail className="h-5 w-5 text-oma-plum" />
          <h3 className="mt-3 font-canela text-lg text-oma-black">
            Watch your inbox
          </h3>
          <p className="mt-1 text-sm text-oma-cocoa/80">
            Our newsletter carries industry insights and platform updates
            worth knowing about.
          </p>
        </div>
        <div className="rounded-xl border border-oma-cocoa/15 p-5">
          <CalendarClock className="h-5 w-5 text-oma-plum" />
          <h3 className="mt-3 font-canela text-lg text-oma-black">
            Apply for future events
          </h3>
          <p className="mt-1 text-sm text-oma-cocoa/80">
            Every OmaHub edition has an application window - keep an eye out
            for the next one.
          </p>
        </div>
        <div className="rounded-xl border border-oma-cocoa/15 p-5">
          <Sparkles className="h-5 w-5 text-oma-plum" />
          <h3 className="mt-3 font-canela text-lg text-oma-black">
            Stay connected
          </h3>
          <p className="mt-1 text-sm text-oma-cocoa/80">
            New opportunities and platform features roll out regularly - this
            page is a good one to revisit.
          </p>
        </div>
      </div>
    </div>
  );
}
