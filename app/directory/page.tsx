import { Suspense } from "react";
import DirectoryClient from "./DirectoryClient";
import { SectionHeader } from "@/components/ui/section-header";

export default function Directory() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <SectionHeader
          title="Designer Directory"
          subtitle="Discover talented African designers and artisans"
          centered={true}
          titleClassName="font-canela text-3xl md:text-4xl"
          subtitleClassName="text-oma-cocoa/80"
        />

        <Suspense
          fallback={
            <div className="mt-8 text-center">Loading directory...</div>
          }
        >
          <DirectoryClient />
        </Suspense>
      </div>
    </div>
  );
}
